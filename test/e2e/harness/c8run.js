/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

'use strict';

const os = require('os');
const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');

const { createReadStream } = require('fs');
const { pipeline } = require('stream/promises');

const { execFile, spawn } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

// The Camunda 8 Run minor line under test. This is the download center's rolling
// shorthand: the artifact behind it is replaced on every 8.10 release, so the
// engine can change without a commit here. That is deliberate — we want early
// warning when an engine build breaks the modeler's deployment path — and it is
// why the CI cache is keyed on the artifact's ETag rather than on this string
// (see .github/workflows/CI.yml). Pin an exact patch (e.g. `8.9.19`, with the
// version repeated in the file name) to make runs fully reproducible instead.
const C8RUN_VERSION = '8.10';

// Where the distribution is extracted. Kept out of the OS temp directory so a
// local run extracts ~900 MB once rather than on every invocation; CI points its
// cache at the same path.
const C8RUN_DIR = path.resolve(__dirname, '../../../.c8run');

// c8run's default REST gateway, matching the `c8run (local)` connection the app
// creates for itself (see ConnectionManagerPlugin `DEFAULT_ENDPOINT`).
const GATEWAY_URL = 'http://localhost:8080/v2';

const DOWNLOAD_BASE_URL = 'https://downloads.camunda.cloud/release/camunda/c8run';

// Records that this run started the cluster itself, so `stop` stops only what
// `start` started: a developer running the suite against their own running
// c8run must get it back, in the state they left it. A file rather than module
// state because `start` and `stop` are separate invocations of this CLI.
const STARTED_MARKER = path.join(os.tmpdir(), 'cm-e2e-c8run-started');

// Where c8run's own stdout/stderr is captured. The distribution also writes to
// its `log/` directory, which `describeLogs()` points at.
const LOG_FILE = path.join(C8RUN_DIR, 'c8run.log');

// Names the extracted distribution directory. The archive unpacks to a
// version-stamped name that differs per platform and per resolved version, so
// the choice is recorded rather than guessed.
const INSTALL_FILE = path.join(C8RUN_DIR, '.install');

/**
 * @return {string} the platform's c8run archive name
 */
function archiveName() {
  const platform = os.platform();

  if (platform === 'linux') {
    return `camunda8-run-${ C8RUN_VERSION }-linux-x86_64.tar.gz`;
  }

  if (platform === 'darwin') {
    const arch = os.arch() === 'arm64' ? 'aarch64' : 'x86_64';

    return `camunda8-run-${ C8RUN_VERSION }-darwin-${ arch }.zip`;
  }

  if (platform === 'win32') {
    return `camunda8-run-${ C8RUN_VERSION }-windows-x86_64.zip`;
  }

  throw new Error(`unsupported platform <${ platform }>`);
}

/**
 * @return {string} download URL for the platform's c8run archive
 */
function downloadUrl() {
  return `${ DOWNLOAD_BASE_URL }/${ C8RUN_VERSION }/${ archiveName() }`;
}

/**
 * Ask the gateway for its topology. The readiness probe, and also how we learn
 * which engine version we actually got (the version is not knowable up front,
 * see C8RUN_VERSION).
 *
 * @return {Promise<{ gatewayVersion?: string }|null>} null if unreachable
 */
async function topology() {
  try {
    const response = await fetch(`${ GATEWAY_URL }/topology`, {
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}

/**
 * @return {Promise<boolean>} whether a cluster already answers on the gateway
 */
async function isRunning() {
  return !!await topology();
}

/**
 * Poll the gateway until it answers, to an explicit deadline. Bounded here
 * rather than by the runner so a cluster that never comes up fails with a
 * diagnosable message instead of an opaque timeout.
 *
 * `hasFailed` lets the caller surface a process that died — or never started —
 * instead of waiting out the full deadline for one that is never coming back,
 * which is what a rejected command line looks like otherwise.
 *
 * @param {number} [timeout] milliseconds
 * @param {() => { code?: number|null, signal?: string|null, error?: Error }|null} [hasFailed]
 *
 * @return {Promise<{ gatewayVersion?: string }>}
 */
async function waitUntilReady(timeout = 600000, hasFailed = () => null) {
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    const result = await topology();

    if (result) {
      return result;
    }

    const failed = hasFailed();

    if (failed) {
      throw new Error(
        (
          failed.error
            ? `Camunda 8 Run could not be started: ${ failed.error.message }`
            : `Camunda 8 Run exited before becoming ready (code ${ failed.code }, signal ${ failed.signal })`
        ) + '.\n' + await describeLogs()
      );
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  throw new Error(
    `Camunda 8 Run did not become ready within ${ timeout }ms. ` +
    `No topology from ${ GATEWAY_URL }/topology.\n` +
    await describeLogs()
  );
}

/**
 * Resolve the artifact's content hash by following the download center's
 * redirect to storage, which reports the stored object's MD5 as its ETag.
 *
 * @return {Promise<string|null>} null if the artifact cannot be reached
 */
async function resolveEtag() {
  try {
    const response = await fetch(downloadUrl(), {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      return null;
    }

    const etag = response.headers.get('etag');

    return etag ? etag.replaceAll('"', '') : null;
  } catch {
    return null;
  }
}

/**
 * Remove every distribution already unpacked under C8RUN_DIR, keeping the
 * downloaded archive.
 *
 * Called just before extracting: whatever is there is either the version being
 * replaced or a leftover, and extracting on top of an ambiguous directory would
 * leave the ambiguity in place — with no way to tell afterwards which directory
 * the extraction produced.
 *
 * @return {Promise<void>}
 */
async function removeInstalledDistributions() {
  const name = os.platform() === 'win32' ? 'c8run.exe' : 'c8run';

  let entries = [];

  try {
    entries = await fs.readdir(C8RUN_DIR, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const dir = path.join(C8RUN_DIR, entry.name);

    if (await exists(path.join(dir, name))) {
      await fs.rm(dir, { recursive: true, force: true });
    }
  }
}

/**
 * Note which distribution directory is the current one, so a later lookup does
 * not have to guess between two of them.
 *
 * @param {string} dir
 *
 * @return {Promise<string>} dir
 */
async function recordInstall(dir) {
  await fs.writeFile(INSTALL_FILE, path.basename(dir));

  return dir;
}

/**
 * Download and extract the distribution, unless the extracted one is already
 * the current artifact.
 *
 * C8RUN_VERSION pins a rolling minor line, and the archive extracts to a
 * directory stamped with the resolved version (`c8run-8.10.0-alpha5/`). So
 * "already extracted" is not the same question as "up to date": once the alias
 * moves, a stale directory would keep answering and we would go on testing an
 * engine nobody ships. Recording the artifact's ETag and re-extracting when it
 * changes is the same guard CI applies with its cache key.
 *
 * @return {Promise<string>} path to the directory holding the `c8run` executable
 */
async function install() {
  await fs.mkdir(C8RUN_DIR, { recursive: true });

  const etagFile = path.join(C8RUN_DIR, '.etag');
  const etag = await resolveEtag();

  const executable = await findExecutable();

  if (executable) {
    const installedEtag = await readIfExists(etagFile);

    // No ETag means we could not reach the download center — use what we have
    // rather than failing an otherwise runnable suite. An unrecorded ETag means
    // this distribution predates the guard: adopt it rather than forcing a
    // gratuitous ~900 MB re-download, and check it from the next run onwards.
    if (!etag) {
      console.log(
        `[c8run] using the installed distribution ${ path.dirname(executable) } ` +
        '(could not reach the download center to check for a newer artifact)'
      );

      return recordInstall(path.dirname(executable));
    }

    if (!installedEtag) {
      console.log(
        `[c8run] using the installed distribution ${ path.dirname(executable) } ` +
        '(no recorded artifact, adopting the current one)'
      );

      await fs.writeFile(etagFile, etag);

      return recordInstall(path.dirname(executable));
    }

    if (etag === installedEtag) {
      console.log(`[c8run] using the installed distribution ${ path.dirname(executable) } (artifact unchanged)`);

      return recordInstall(path.dirname(executable));
    }

    console.log('[c8run] the pinned line moved; re-installing');

    await reset();
    await fs.mkdir(C8RUN_DIR, { recursive: true });
  }

  const archive = path.join(C8RUN_DIR, archiveName());

  // The archive is named after the rolling line rather than the resolved
  // version, so a stale or half-downloaded file sits at exactly the path we
  // would reuse. Its bytes are checked before it is trusted: reusing them and
  // then recording the current ETag below would stamp the wrong build as
  // current, and every later run would accept it.
  if (await exists(archive) && await archiveMatches(archive, etag)) {
    console.log(`[c8run] using the already downloaded ${ archive }`);
  } else {
    console.log(`[c8run] downloading ${ downloadUrl() }`);

    await fs.rm(archive, { force: true });

    await execFileAsync('curl', [ '-fsSL', '--retry', '3', '-o', archive, downloadUrl() ], {
      maxBuffer: 1024 * 1024
    });

    // The alias can move between resolving the ETag and finishing the
    // download; extracting bytes we cannot account for would be worse than
    // asking for another run.
    if (!await archiveMatches(archive, etag)) {
      throw new Error(
        `the downloaded ${ archiveName() } does not match the resolved artifact (ETag ${ etag }). ` +
        'The pinned line may have moved mid-download; run again.'
      );
    }
  }

  await removeInstalledDistributions();

  console.log(`[c8run] extracting ${ archive }`);

  await execFileAsync(tarExecutable(), [ '-xf', archive, '-C', C8RUN_DIR ]);

  const extracted = await findExecutable();

  if (!extracted) {
    throw new Error(`no c8run executable found in ${ C8RUN_DIR } after extracting ${ archive }`);
  }

  if (etag) {
    await fs.writeFile(etagFile, etag);
  }

  return recordInstall(path.dirname(extracted));
}

/**
 * Remove the installed distribution.
 *
 * @return {Promise<void>}
 */
async function reset() {
  await fs.rm(C8RUN_DIR, { recursive: true, force: true });
}

/**
 * Start the cluster and wait until it is ready.
 *
 * Connectors are disabled: the deployment specs deploy resources and start
 * instances, neither of which needs a job worker, and skipping them cuts both
 * boot time and memory. That is the only flag passed — `c8run start` rejects
 * anything it does not define and exits immediately, so the flag list is kept
 * to what `./c8run --help` documents.
 *
 * Output is captured to a log rather than discarded: a cluster that fails to
 * boot is otherwise indistinguishable from one that is merely slow.
 *
 * @return {Promise<{ gatewayVersion?: string }>}
 */
async function start() {
  const cwd = await install();

  console.log(`[c8run] starting (logging to ${ LOG_FILE })`);

  const log = await fs.open(LOG_FILE, 'w');

  let failure = null;

  try {
    const child = spawn(executableName(), [ 'start', '--disable-connectors' ], {
      cwd,
      detached: true,
      stdio: [ 'ignore', log.fd, log.fd ],
      shell: os.platform() === 'win32'
    });

    child.on('exit', (code, signal) => {
      failure = { code, signal };
    });

    // A binary that is missing or not executable surfaces here rather than as
    // an exit, and would otherwise be waited out for the full deadline.
    child.on('error', (error) => {
      failure = { error };
    });

    child.unref();

    // Recorded before the wait, not after: a boot that fails still leaves a
    // process behind, and `stop` has to know it is ours to stop.
    await fs.writeFile(STARTED_MARKER, '');

    // awaited, not returned: the `finally` below must not close the log while
    // the cluster is still booting into it
    return await waitUntilReady(undefined, () => failure);
  } finally {
    await log.close();
  }
}

/**
 * Forget any record of having started a cluster.
 *
 * @return {Promise<void>}
 */
async function clearStarted() {
  await fs.rm(STARTED_MARKER, { force: true });
}

/**
 * @return {Promise<boolean>} whether this run started the cluster itself
 */
async function wasStarted() {
  return exists(STARTED_MARKER);
}

/**
 * Stop the cluster, but only if this run started it. A cluster that was already
 * running when the suite began belongs to whoever started it.
 *
 * @return {Promise<boolean>} whether a cluster was stopped
 */
async function stopIfStarted() {
  if (!await wasStarted()) {
    return false;
  }

  const executable = await findExecutable();

  if (!executable) {
    await clearStarted();

    return false;
  }

  console.log('[c8run] stopping');

  try {
    await execFileAsync(executableName(), [ 'stop' ], {
      cwd: path.dirname(executable),
      shell: os.platform() === 'win32'
    });
  } catch (err) {

    // teardown must not fail the run; a leftover cluster is reused next time
    console.warn(`[c8run] stop failed: ${ err.message }`);
  }

  await clearStarted();

  return true;
}

/**
 * Start a cluster unless one is already running, and report which engine we
 * ended up with.
 *
 * @return {Promise<void>}
 */
async function startCommand() {
  if (await isRunning()) {
    const { gatewayVersion } = await topology();

    console.log(`[c8run] reusing the cluster already running on ${ GATEWAY_URL } (gateway ${ gatewayVersion })`);

    // Not a hard failure: CI always boots the pinned line, so a mismatch only
    // means a local run may not reproduce CI. Say so loudly and carry on.
    if (gatewayVersion && !gatewayVersion.startsWith(C8RUN_VERSION)) {
      console.warn(
        `[c8run] WARNING: gateway ${ gatewayVersion } does not match the pinned ` +
        `${ C8RUN_VERSION } line. Results may differ from CI.`
      );
    }

    return;
  }

  // Nothing is answering, so a marker an interrupted run left behind cannot
  // refer to a live cluster — forget it rather than let `stop` believe it owns
  // whatever boots next. On the reuse path above the marker is kept: if we
  // booted the cluster that is still answering, we still own it.
  await clearStarted();

  const { gatewayVersion } = await start();

  // The pinned line is a rolling alias, so the engine version is not knowable
  // before boot. Printing it is what makes a failure diagnosable later.
  console.log(`[c8run] started (gateway ${ gatewayVersion })`);
}

/**
 * Print the pinned artifact's content hash, for use as a cache key.
 *
 * `C8RUN_VERSION` pins a rolling minor line, so the URL is not a usable key —
 * the bytes behind it change while it stays the same. The stored object's MD5
 * is, and resolving it here keeps the redirect-following out of the workflow.
 *
 * @return {Promise<void>}
 */
async function etagCommand() {
  const etag = await resolveEtag();

  if (!etag) {
    throw new Error(`could not resolve an ETag for ${ downloadUrl() }`);
  }

  console.log(etag);
}

/**
 * Stop the cluster, if this machine started it.
 *
 * @return {Promise<void>}
 */
async function stopCommand() {
  const stopped = await stopIfStarted();

  if (!stopped) {
    console.log('[c8run] leaving the pre-existing cluster running');
  }
}


// `node test/e2e/harness/c8run.js start|stop` — the cluster lifecycle is driven
// from the CI workflow and from npm scripts, not from the test run, so the
// tests can assume a cluster is already there. This module is that CLI; nothing
// imports it.
if (require.main === module) {
  const [ command ] = process.argv.slice(2);

  const commands = {
    start: startCommand,
    stop: stopCommand,
    etag: etagCommand
  };

  const run = commands[ command ];

  if (!run) {
    console.error(`usage: c8run.js <start|stop|etag> (got <${ command || '' }>)`);

    process.exit(2);
  }

  run().catch((err) => {
    console.error(err.message);

    process.exit(1);
  });
}


// helpers ///////////////

function executableName() {
  return os.platform() === 'win32' ? '.\\c8run.exe' : './c8run';
}

/**
 * bsdtar reads zip as well as tar.gz, so one command extracts every platform's
 * archive. On Windows it is addressed by absolute path: the workflow's shell
 * there is Git Bash, whose `/usr/bin/tar` is GNU tar and cannot read a zip,
 * while the system's own `tar.exe` is bsdtar.
 *
 * @return {string}
 */
function tarExecutable() {
  if (os.platform() !== 'win32') {
    return 'tar';
  }

  return path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe');
}

/**
 * Whether the archive on disk is the artifact the download center currently
 * serves. The ETag is the stored object's MD5, so this compares the bytes
 * themselves — which also catches a download that stopped halfway.
 *
 * @param {string} archive
 * @param {string|null} etag
 *
 * @return {Promise<boolean>} true unless the bytes are known to differ
 */
async function archiveMatches(archive, etag) {

  // No ETag means we could not reach the download center, and a multipart ETag
  // (`<hash>-<parts>`) is not a plain MD5. Neither is evidence against what is
  // on disk, so keep it rather than force a ~900 MB re-download.
  if (!etag || etag.includes('-')) {
    return true;
  }

  return await md5(archive) === etag;
}

/**
 * @param {string} filePath
 *
 * @return {Promise<string>} the file's MD5, hashed as a stream so a ~900 MB
 *   archive is never held in memory
 */
async function md5(filePath) {
  const hash = crypto.createHash('md5');

  await pipeline(createReadStream(filePath), hash);

  return hash.digest('hex');
}

/**
 * Locate the executable rather than assume a layout: the archive extracts to a
 * directory stamped with the resolved version (`c8run-8.10.0-alpha5/`), which
 * C8RUN_VERSION's rolling line does not tell us up front.
 *
 * @return {Promise<string|null>}
 */
async function findExecutable() {
  const name = os.platform() === 'win32' ? 'c8run.exe' : 'c8run';

  // Which directory we extracted is recorded rather than inferred. Extraction
  // preserves the archive's timestamps, so a directory's mtime says when the
  // distribution was built, not when we unpacked it — there is no reliable way
  // to tell two of them apart after the fact.
  const recorded = await readIfExists(INSTALL_FILE);

  if (recorded) {
    const candidate = path.join(C8RUN_DIR, recorded, name);

    if (await exists(candidate)) {
      return candidate;
    }
  }

  let entries = [];

  try {
    entries = await fs.readdir(C8RUN_DIR, { withFileTypes: true });
  } catch {
    return null;
  }

  const candidates = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const candidate = path.join(C8RUN_DIR, entry.name, name);

    if (await exists(candidate)) {
      candidates.push(entry.name);
    }
  }

  if (candidates.length === 1) {
    return path.join(C8RUN_DIR, candidates[0], name);
  }

  if (candidates.length > 1) {

    // An interrupted re-install can leave two distributions side by side.
    // Picking one would mean running an arbitrary engine version, so report it
    // as not installed: the caller extracts again and records the result.
    console.warn(
      `[c8run] several distributions in ${ C8RUN_DIR } (${ candidates.join(', ') }) ` +
      'and no record of which is current; re-installing'
    );
  }

  return null;
}

/**
 * Summarize what c8run left behind, for an error message. The captured output
 * is usually enough on its own: a rejected flag or a port clash shows up in the
 * first few lines.
 *
 * @return {Promise<string>}
 */
async function describeLogs() {
  const captured = await readIfExists(LOG_FILE);

  const installed = await readIfExists(INSTALL_FILE);

  const distributionLogs = path.join(C8RUN_DIR, installed || '', 'log');

  const lines = [
    `c8run output (${ LOG_FILE }):`,
    captured ? captured.split('\n').slice(-40).join('\n') : '  <empty>',
    `Camunda's own logs, if it got that far: ${ distributionLogs }`
  ];

  return lines.join('\n');
}

async function readIfExists(filePath) {
  try {
    return (await fs.readFile(filePath, 'utf8')).trim();
  } catch {
    return null;
  }
}

async function exists(filePath) {
  try {
    await fs.access(filePath);

    return true;
  } catch {
    return false;
  }
}
