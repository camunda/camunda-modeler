#!/usr/bin/env node

/**
 * Checks bpmn.io / Camunda dependencies of this project for "pending
 * releases": commits landed on the dependency's default branch, after its
 * latest git tag, that look like they should ship (feat / fix / deps
 * commits) but haven't been released yet.
 *
 * This is deliberately based on the latest git tag, not the version this
 * project currently consumes - a feature already released upstream (just
 * not yet bumped here) is an available update, not a pending release.
 *
 * Reads the package list from tracked-dependencies.json (direct AND
 * transitive dependencies - a transitive one can carry pending fixes just
 * as much as a direct one). Run `node tasks/list-tracked-dependencies.js`
 * first to (re)generate it from the root package-lock.json.
 *
 * Requires the GitHub CLI (`gh`) to be installed and authenticated. npm is
 * only used once per package, to resolve its GitHub repo.
 *
 * Packages are checked concurrently (each check is a handful of sequential
 * `gh api` / npm calls, so wall-clock time is dominated by network latency,
 * not CPU - concurrency is a straightforward win).
 *
 * Usage:
 *   node tasks/check-pending-releases.js [--json] [--concurrency=10] [--markdown=<path>] [--slack=<path>]
 *
 * --markdown appends a Markdown report to <path> (e.g. $GITHUB_STEP_SUMMARY
 * when run from a GitHub Actions job).
 *
 * --slack writes a ready-to-post Slack `chat.postMessage` JSON payload to
 * <path> (e.g. for slackapi/slack-github-action's `payload-file-path`),
 * using the channel from the SLACK_CHANNEL_ID env var - but only when
 * there's something pending; the file is left unwritten on a quiet day so
 * a caller can skip posting via e.g. `hashFiles(path) != ''`.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const semver = require('semver');

const execFileAsync = promisify(execFile);

const ROOT = path.join(__dirname, '..');
const TRACKED_DEPENDENCIES_FILE = path.join(__dirname, 'tracked-dependencies.json');

const CONVENTIONAL_TYPES = [ 'feat', 'fix', 'deps' ];
const DEFAULT_CONCURRENCY = 10;

function loadTrackedDependencies() {
  if (!fs.existsSync(TRACKED_DEPENDENCIES_FILE)) {
    console.error(
      `${path.relative(ROOT, TRACKED_DEPENDENCIES_FILE)} not found.\n` +
      'Run `node tasks/list-tracked-dependencies.js` first.'
    );
    process.exit(1);
  }

  return JSON.parse(fs.readFileSync(TRACKED_DEPENDENCIES_FILE, 'utf8'));
}

async function ghApi(endpoint) {
  const { stdout } = await execFileAsync('gh', [ 'api', endpoint ], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 20
  });
  return JSON.parse(stdout);
}

async function ghApiSafe(endpoint) {
  try {
    return await ghApi(endpoint);
  } catch (error) {
    return null;
  }
}

/**
 * Looks up a package's repository URL on npm. Returns `{ ok: true, url }`
 * on a completed lookup (`url` is null if there's no repo field, or the
 * package/version wasn't found) and `{ ok: false }` if the lookup itself
 * failed (network/DNS error) - distinct from "no repo declared", so a
 * transient failure surfaces as unresolved rather than as a confident
 * "this package has no repository".
 */
async function fetchNpmRepoUrl(name) {
  try {
    const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name).replace(/%40/g, '@')}/latest`);

    if (!res.ok) {
      return { ok: true, url: null };
    }

    const doc = await res.json();

    return { ok: true, url: doc.repository && doc.repository.url };
  } catch (error) {
    return { ok: false, url: null };
  }
}

function parseGithubRepo(repositoryUrl) {
  if (!repositoryUrl) return null;

  const match = repositoryUrl.match(/github\.com[:/]([^/]+)\/([^/.]+?)(\.git)?(\/|$)/);

  if (!match) return null;

  return { owner: match[1], repo: match[2] };
}

/**
 * Strips an optional `v` prefix or `<package-name>@` scope prefix (used by
 * monorepos with independently-versioned packages) so the remainder can be
 * parsed as semver.
 */
function versionFromTag(tagName, name) {
  let rest = tagName;

  if (name && rest.startsWith(`${name}@`)) {
    rest = rest.slice(name.length + 1);
  } else if (rest.startsWith('v')) {
    rest = rest.slice(1);
  }

  return semver.valid(rest) ? rest : null;
}

const TAGS_PER_PAGE = 100;
const MAX_TAG_PAGES = 5; // up to 500 tags - well beyond any repo we track

/**
 * Fetches up to MAX_TAG_PAGES pages of tags. Stops early once a page comes
 * back short (the last page). A prior version only fetched the first page,
 * silently missing the closest reachable tag on repos with a long history.
 */
async function fetchAllTags(owner, repo) {
  const all = [];

  for (let page = 1; page <= MAX_TAG_PAGES; page++) {
    const pageTags = await ghApiSafe(`repos/${owner}/${repo}/tags?per_page=${TAGS_PER_PAGE}&page=${page}`);

    if (!pageTags || pageTags.length === 0) break;

    all.push(...pageTags);

    if (pageTags.length < TAGS_PER_PAGE) break;
  }

  return all;
}

/**
 * The latest git tag for a package: the tag on the default branch's own
 * history that sits closest to its tip (`git describe --tags` semantics).
 *
 * Neither "highest semver tag" nor GitHub's "latest release" work here:
 * repos can carry old tags with deceptively high numbers from before a
 * version reset/rename (e.g. bpmn-io/bpmn-js-properties-panel has a
 * `v6.0.1` tag from February sitting on an abandoned line, while `v5.64.0`
 * - lower semver - is literally the current tip of `main`), and some repos
 * stop publishing GitHub Releases while still tagging every version.
 *
 * Tags not reachable from the default branch (prereleases cut on a separate
 * next-major branch, e.g. diagram-js's `v16.0.0-esm.2`) are excluded by the
 * ancestry check itself.
 */
async function getLatestTag(owner, repo, name, branch) {
  const tags = await fetchAllTags(owner, repo);

  if (!tags.length) return null;

  const candidates = tags
    .map(t => ({ tag: t.name, version: versionFromTag(t.name, name) }))
    .filter(c => c.version);

  let best = null;

  // Ancestry has to be probed one candidate at a time (each probe can
  // short-circuit the search), so this loop stays sequential - it's the
  // per-package concurrency in runPool() that gives the real speedup. Every
  // fetched candidate is probed (no arbitrary early cutoff) - a repo can
  // carry many non-ancestor tags (abandoned lines, sibling monorepo
  // packages) before reaching the actually-closest one; the early `break`
  // below still keeps the common case cheap.
  for (const candidate of candidates) {
    const compare = await ghApiSafe(`repos/${owner}/${repo}/compare/${encodeURIComponent(branch)}...${encodeURIComponent(candidate.tag)}`);

    if (!compare || compare.ahead_by > 0) continue; // not an ancestor of the default branch

    const distance = compare.behind_by;

    if (!best || distance < best.distance) {
      best = { ...candidate, distance };
    }

    if (distance === 0) break; // can't beat being the branch tip itself
  }

  return best;
}

async function getDefaultBranch(owner, repo) {
  const info = await ghApiSafe(`repos/${owner}/${repo}`);
  return info ? info.default_branch : null;
}

const packageDirectoryCache = new Map();

/**
 * In an independently-versioned monorepo (tags like `<name>@<version>`), a
 * commit ahead of one package's tag is only actually relevant to that
 * package if it touches that package's own directory - otherwise it's a
 * sibling package's change (e.g. camunda/element-templates-json-schema has
 * 4 independently-tagged packages under packages/*, and a commit scoped to
 * one of them shows up as "ahead" for all of them without this check).
 *
 * Convention across these monorepos is packages/<unscoped-name>; verified
 * by finding a package.json there whose own `name` matches. Cached per repo
 * since sibling packages share one lookup.
 */
async function findPackageDirectory(owner, repo, branch, name) {
  const cacheKey = `${owner}/${repo}`;

  if (!packageDirectoryCache.has(cacheKey)) {
    packageDirectoryCache.set(cacheKey, (async () => {
      const tree = await ghApiSafe(`repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`);

      if (!tree || tree.truncated) return null;

      return (tree.tree || [])
        .filter(entry => entry.type === 'blob' && entry.path.endsWith('/package.json'))
        .map(entry => entry.path.slice(0, -'/package.json'.length));
    })());
  }

  const candidateDirs = await packageDirectoryCache.get(cacheKey);

  if (!candidateDirs) return null;

  const unscopedName = name.replace(/^@[^/]+\//, '');
  const byBasename = candidateDirs.filter(dir => dir.split('/').pop() === unscopedName);

  for (const dir of byBasename) {
    const pkg = await ghApiSafe(`repos/${owner}/${repo}/contents/${dir}/package.json?ref=${encodeURIComponent(branch)}`);
    const content = pkg && pkg.content && JSON.parse(Buffer.from(pkg.content, 'base64').toString('utf8'));

    if (content && content.name === name) return dir;
  }

  return null;
}

/**
 * Whether a commit touches a given directory. Returns `null` (unknown,
 * distinct from `false`) if the per-commit lookup itself fails - a
 * rate-limit or transient API error must not be silently read as "doesn't
 * touch the directory", or a genuinely-pending commit could be dropped and
 * the package wrongly reported as up-to-date.
 */
async function commitTouchesDirectory(owner, repo, sha, dir) {
  const commit = await ghApiSafe(`repos/${owner}/${repo}/commits/${sha}`);

  if (!commit) return null;

  const files = commit.files || [];

  return files.some(f => f.filename === dir || f.filename.startsWith(`${dir}/`));
}

async function getPendingCommits(owner, repo, tag, branch, packageDir) {
  const compare = await ghApiSafe(`repos/${owner}/${repo}/compare/${encodeURIComponent(tag)}...${encodeURIComponent(branch)}`);

  if (!compare) return null;

  const commits = compare.commits || [];

  // GitHub's compare endpoint caps at 250 commits with no further
  // pagination for this range; beyond that, silently reading only what
  // came back risks missing a feat/fix/deps commit and wrongly reporting
  // up-to-date. Surface it as unresolved instead of guessing.
  if (compare.total_commits > commits.length) {
    return { truncated: true };
  }

  let matching = commits.filter(c => CONVENTIONAL_TYPES.some(
    type => new RegExp(`^${type}(\\(.+\\))?!?:`).test(c.commit.message.split('\n')[0])
  ));

  // Narrow to commits that actually touch this package's own directory -
  // a monorepo sibling's changes aren't pending for this package.
  if (packageDir) {
    const touches = await Promise.all(matching.map(c => commitTouchesDirectory(owner, repo, c.sha, packageDir)));

    if (touches.some(t => t === null)) {
      return { directoryCheckFailed: true };
    }

    matching = matching.filter((c, i) => touches[i]);
  }

  return {
    totalCommitsAhead: commits.length,
    matchingCommits: matching.map(c => c.commit.message.split('\n')[0]),
    compareUrl: `https://github.com/${owner}/${repo}/compare/${tag}...${branch}`
  };
}

/**
 * One-line summary of a single checked package, for progress reporting.
 */
function describe(result) {
  switch (result.status) {
  case 'pending-release': return `${result.matchingCommits.length} pending commit(s) past ${result.latestTag}`;
  case 'up-to-date': return `up to date (${result.latestTag})`;
  case 'npm-lookup-failed': return 'npm lookup failed (network error)';
  case 'no-repo-found': return 'no GitHub repo found on npm';
  case 'repo-inaccessible': return `repo ${result.owner}/${result.repo} inaccessible`;
  case 'tag-not-found': return `no matching tag found in ${result.owner}/${result.repo}`;
  case 'directory-not-found': return `couldn't locate package directory in ${result.owner}/${result.repo}`;
  case 'compare-failed': return `GitHub compare failed for ${result.owner}/${result.repo}`;
  case 'compare-truncated': return `compare range too large to check reliably for ${result.owner}/${result.repo}`;
  case 'directory-check-failed': return `commit lookup failed while scoping to package directory in ${result.owner}/${result.repo}`;
  case 'check-failed': return `unexpected error: ${result.error}`;
  default: return result.status;
  }
}

async function checkPackage({ name, version, direct }) {
  const base = { name, version, direct };

  const npmLookup = await fetchNpmRepoUrl(name);

  if (!npmLookup.ok) {
    return { ...base, status: 'npm-lookup-failed' };
  }

  const repoInfo = parseGithubRepo(npmLookup.url);

  if (!repoInfo) {
    return { ...base, status: 'no-repo-found' };
  }

  const { owner, repo } = repoInfo;
  const branch = await getDefaultBranch(owner, repo);

  if (!branch) {
    return { ...base, owner, repo, status: 'repo-inaccessible' };
  }

  const latest = await getLatestTag(owner, repo, name, branch);

  if (!latest) {
    return { ...base, owner, repo, status: 'tag-not-found' };
  }

  const withTag = { ...base, owner, repo, latestVersion: latest.version, latestTag: latest.tag };

  // A `<name>@<version>` tag means this package is independently versioned
  // within a monorepo - scope the pending-commit check to its own
  // directory, or a sibling package's changes would count as pending here.
  // If that directory can't be found, fail closed (report unresolved)
  // rather than silently falling back to an unscoped, false-positive-prone
  // check - the exact bug this guard exists to prevent.
  let packageDir = null;

  if (latest.tag.startsWith(`${name}@`)) {
    packageDir = await findPackageDirectory(owner, repo, branch, name);

    if (!packageDir) {
      return { ...withTag, status: 'directory-not-found' };
    }
  }

  const pending = await getPendingCommits(owner, repo, latest.tag, branch, packageDir);

  if (!pending) {
    return { ...withTag, status: 'compare-failed' };
  }

  if (pending.truncated) {
    return { ...withTag, status: 'compare-truncated' };
  }

  if (pending.directoryCheckFailed) {
    return { ...withTag, status: 'directory-check-failed' };
  }

  return {
    ...withTag,
    updateAvailable: version !== latest.version,
    status: pending.matchingCommits.length > 0 ? 'pending-release' : 'up-to-date',
    ...pending
  };
}

/**
 * Runs `worker` over `items` with at most `limit` in flight at once.
 * Preserves input order in the returned array; `onResult` fires as each
 * item finishes (out of order), for live progress reporting.
 *
 * A `worker` rejection is caught per-item rather than propagating - an
 * unexpected error (a transient network failure, a bug) on one package
 * must not abort the whole run and lose the report for every other
 * package already checked or in flight.
 */
async function runPool(items, limit, worker, onResult) {
  const results = new Array(items.length);
  let nextIndex = 0;
  let completed = 0;

  const workerCount = Math.max(1, Math.min(limit, items.length));

  async function runNext() {
    while (nextIndex < items.length) {
      const current = nextIndex++;
      let result;

      try {
        result = await worker(items[current]);
      } catch (error) {
        result = { ...items[current], status: 'check-failed', error: error.message };
      }

      results[current] = result;
      completed++;
      onResult(result, completed, items.length);
    }
  }

  const workers = Array.from({ length: workerCount }, runNext);
  await Promise.all(workers);

  return results;
}

async function main(concurrency, onResult) {
  const tracked = loadTrackedDependencies();

  return runPool(tracked, concurrency, checkPackage, onResult);
}

function printPendingDetail(r) {
  console.log(`- ${r.name} [${r.direct ? 'direct' : 'transitive'}] (currently ${r.version}, latest published ${r.latestVersion}, ${r.owner}/${r.repo})`);
  console.log(`  ${r.matchingCommits.length} relevant / ${r.totalCommitsAhead} commits ahead of ${r.latestTag}`);

  for (const subject of r.matchingCommits) {
    console.log(`    * ${subject}`);
  }

  console.log(`  ${r.compareUrl}\n`);
}

function buildMarkdownReport(results) {
  const pending = results.filter(r => r.status === 'pending-release');
  const upToDate = results.filter(r => r.status === 'up-to-date');
  const issues = results.filter(r => ![ 'pending-release', 'up-to-date' ].includes(r.status));

  const lines = [ '## bpmn.io / Camunda pending releases', '' ];

  // Headline: packages with commits upstream that have NOT been released
  // yet. This is the crucial signal this report exists for. Whether a
  // dependency also needs bumping here (an ordinary update) is out of
  // scope - only unreleased upstream work belongs in this summary.
  lines.push(pending.length
    ? `### ⚠️ ${pending.length} package(s) have unreleased feat/fix/deps commits upstream`
    : '### ✅ No packages have unreleased feat/fix/deps commits upstream', '');

  if (pending.length) {
    for (const r of pending) {
      lines.push(`#### ${r.name} \`${r.version}\` [${r.direct ? 'direct' : 'transitive'}]`, '');
      lines.push(`[${r.owner}/${r.repo}](https://github.com/${r.owner}/${r.repo}) - ` +
        `${r.matchingCommits.length} relevant / ${r.totalCommitsAhead} commits ahead of \`${r.latestTag}\` ` +
        `([compare](${r.compareUrl}))`, '');

      for (const subject of r.matchingCommits) {
        lines.push(`- ${subject}`);
      }

      lines.push('');
    }
  }

  lines.push(`Checked ${results.length} dependencies (direct + transitive): ` +
    `${pending.length} pending release, ${upToDate.length} up to date, ${issues.length} unresolved.`, '');

  if (issues.length) {
    lines.push('<details><summary>Could not check</summary>', '');

    for (const r of issues) {
      lines.push(`- ${r.name}${r.version ? '@' + r.version : ''}: ${r.status}`);
    }

    lines.push('', '</details>', '');
  }

  return lines.join('\n');
}

/**
 * A Slack `chat.postMessage` payload reminding about pending releases, or
 * null if there's nothing to report - a daily reminder should stay silent
 * on a quiet day rather than posting "nothing pending" every morning.
 */
function buildSlackPayload(results, channel) {
  const pending = results.filter(r => r.status === 'pending-release');

  if (!pending.length) return null;

  const lines = [ `:warning: *${pending.length} bpmn.io/Camunda package(s) have unreleased upstream changes*` ];

  for (const r of pending) {
    lines.push(`• <${r.compareUrl}|${r.name}> - ${r.matchingCommits.length} commit(s) past \`${r.latestTag}\``);
  }

  return { channel, text: lines.join('\n') };
}

const jsonMode = process.argv.includes('--json');

const concurrencyArg = process.argv.find(a => a.startsWith('--concurrency='));
const requestedConcurrency = concurrencyArg ? Number(concurrencyArg.split('=')[1]) : DEFAULT_CONCURRENCY;

// An invalid value (0, negative, NaN) would make the pool spin up zero
// workers, silently "checking" nothing while still reporting the full
// dependency count as checked - fall back to the default instead.
const concurrency = Number.isInteger(requestedConcurrency) && requestedConcurrency > 0
  ? requestedConcurrency
  : DEFAULT_CONCURRENCY;

if (concurrencyArg && concurrency !== requestedConcurrency) {
  console.error(`Invalid --concurrency value (${concurrencyArg.split('=')[1]}), falling back to ${DEFAULT_CONCURRENCY}`);
}

const markdownArg = process.argv.find(a => a.startsWith('--markdown='));
const markdownPath = markdownArg ? markdownArg.split('=').slice(1).join('=') : null;

const slackArg = process.argv.find(a => a.startsWith('--slack='));
const slackPath = slackArg ? slackArg.split('=').slice(1).join('=') : null;

main(concurrency, (result, completed, total) => {
  const progress = `[${completed}/${total}] ${result.name} - ${describe(result)}`;

  // Progress always goes to stderr, so --json's stdout stays clean and
  // pipeable while still showing live progress in a terminal. Pending-release
  // details are reported together in the final summary instead of here, so
  // they aren't scattered across out-of-order concurrent progress lines.
  console.error(progress);
}).then(results => {
  if (markdownPath) {
    fs.appendFileSync(markdownPath, buildMarkdownReport(results) + '\n');
  }

  if (slackPath) {
    if (!process.env.SLACK_CHANNEL_ID) {
      console.error('--slack given but SLACK_CHANNEL_ID is not set - skipping Slack payload');
    } else {
      const payload = buildSlackPayload(results, process.env.SLACK_CHANNEL_ID);

      // Only write the file when there's something to report, so a
      // workflow can skip the Slack post entirely (via hashFiles) on a
      // quiet day instead of sending an empty reminder.
      if (payload) {
        fs.writeFileSync(slackPath, JSON.stringify(payload, null, 2) + '\n');
      }
    }
  }

  if (jsonMode) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  const pending = results.filter(r => r.status === 'pending-release');
  const upToDate = results.filter(r => r.status === 'up-to-date');
  const issues = results.filter(r => ![ 'pending-release', 'up-to-date' ].includes(r.status));

  // Headline first: packages with commits upstream that have NOT been
  // released yet. That's the only thing this summary reports on - whether
  // a dependency also needs bumping here is a separate, unrelated concern.
  console.log(pending.length
    ? `\n⚠️  ${pending.length} package(s) have unreleased feat/fix/deps commits upstream\n`
    : '\n✅ No packages have unreleased feat/fix/deps commits upstream\n');

  for (const r of pending) {
    printPendingDetail(r);
  }

  console.log(`Checked ${results.length} bpmn.io / Camunda dependencies: ` +
    `${pending.length} pending release, ${upToDate.length} up to date, ${issues.length} unresolved.`);

  if (issues.length) {
    console.log(`\nCould not check ${issues.length}:`);

    for (const r of issues) {
      console.log(`- ${r.name}${r.version ? '@' + r.version : ''}: ${r.status}`);
    }
  }
}).catch(err => {
  console.error(err);
  process.exit(1);
});
