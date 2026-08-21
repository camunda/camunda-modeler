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
 *   node tasks/check-pending-releases.js [--json] [--concurrency=10] [--markdown=<path>]
 *
 * --markdown appends a Markdown report to <path> (e.g. $GITHUB_STEP_SUMMARY
 * when run from a GitHub Actions job).
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
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

async function fetchNpmRepoUrl(name) {
  const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name).replace('%40', '@')}/latest`);

  if (!res.ok) {
    return null;
  }

  const doc = await res.json();

  return doc.repository && doc.repository.url;
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

const ANCESTRY_PROBE_LIMIT = 25;

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
  const tags = await ghApiSafe(`repos/${owner}/${repo}/tags?per_page=100`);

  if (!tags) return null;

  const candidates = tags
    .map(t => ({ tag: t.name, version: versionFromTag(t.name, name) }))
    .filter(c => c.version)
    .slice(0, ANCESTRY_PROBE_LIMIT);

  let best = null;

  // Ancestry has to be probed one candidate at a time (each probe can
  // short-circuit the search), so this loop stays sequential - it's the
  // per-package concurrency in runPool() that gives the real speedup.
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

async function getPendingCommits(owner, repo, tag, branch) {
  const compare = await ghApiSafe(`repos/${owner}/${repo}/compare/${encodeURIComponent(tag)}...${encodeURIComponent(branch)}`);

  if (!compare) return null;

  const commits = (compare.commits || []).map(c => c.commit.message.split('\n')[0]);

  const matching = commits.filter(subject => CONVENTIONAL_TYPES.some(
    type => new RegExp(`^${type}(\\(.+\\))?!?:`).test(subject)
  ));

  return {
    totalCommitsAhead: commits.length,
    matchingCommits: matching,
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
  case 'no-repo-found': return 'no GitHub repo found on npm';
  case 'repo-inaccessible': return `repo ${result.owner}/${result.repo} inaccessible`;
  case 'tag-not-found': return `no matching tag found in ${result.owner}/${result.repo}`;
  case 'compare-failed': return `GitHub compare failed for ${result.owner}/${result.repo}`;
  default: return result.status;
  }
}

async function checkPackage({ name, version, direct }) {
  const base = { name, version, direct };

  const repoUrl = await fetchNpmRepoUrl(name);
  const repoInfo = parseGithubRepo(repoUrl);

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

  const pending = await getPendingCommits(owner, repo, latest.tag, branch);

  if (!pending) {
    return { ...base, latestVersion: latest.version, owner, repo, latestTag: latest.tag, status: 'compare-failed' };
  }

  return {
    ...base,
    latestVersion: latest.version,
    updateAvailable: version !== latest.version,
    owner,
    repo,
    latestTag: latest.tag,
    status: pending.matchingCommits.length > 0 ? 'pending-release' : 'up-to-date',
    ...pending
  };
}

/**
 * Runs `worker` over `items` with at most `limit` in flight at once.
 * Preserves input order in the returned array; `onResult` fires as each
 * item finishes (out of order), for live progress reporting.
 */
async function runPool(items, limit, worker, onResult) {
  const results = new Array(items.length);
  let nextIndex = 0;
  let completed = 0;

  async function runNext() {
    while (nextIndex < items.length) {
      const current = nextIndex++;
      const result = await worker(items[current]);

      results[current] = result;
      completed++;
      onResult(result, completed, items.length);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, runNext);
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
  const updatesAvailable = results.filter(r => r.updateAvailable);
  const issues = results.filter(r => ![ 'pending-release', 'up-to-date' ].includes(r.status));

  const lines = [ '## bpmn.io / Camunda pending releases', '' ];

  lines.push(`Checked ${results.length} dependencies (direct + transitive) - ` +
    `${pending.length} with pending changes, ${upToDate.length} up to date, ${issues.length} unresolved.`, '');

  if (pending.length) {
    for (const r of pending) {
      lines.push(`### ${r.name} \`${r.version}\` [${r.direct ? 'direct' : 'transitive'}]`, '');
      lines.push(`[${r.owner}/${r.repo}](https://github.com/${r.owner}/${r.repo}) - ` +
        `${r.matchingCommits.length} relevant / ${r.totalCommitsAhead} commits ahead of \`${r.latestTag}\` ` +
        `([compare](${r.compareUrl}))`, '');

      for (const subject of r.matchingCommits) {
        lines.push(`- ${subject}`);
      }

      lines.push('');
    }
  } else {
    lines.push('No dependencies with pending feat/fix/deps commits found.', '');
  }

  if (updatesAvailable.length) {
    lines.push('<details><summary>Already released upstream, not yet bumped here</summary>', '');

    for (const r of updatesAvailable) {
      lines.push(`- ${r.name}: ${r.version} → ${r.latestVersion}`);
    }

    lines.push('', '</details>', '');
  }

  if (issues.length) {
    lines.push('<details><summary>Could not check</summary>', '');

    for (const r of issues) {
      lines.push(`- ${r.name}${r.version ? '@' + r.version : ''}: ${r.status}`);
    }

    lines.push('', '</details>', '');
  }

  return lines.join('\n');
}

const jsonMode = process.argv.includes('--json');

const concurrencyArg = process.argv.find(a => a.startsWith('--concurrency='));
const concurrency = concurrencyArg ? Number(concurrencyArg.split('=')[1]) : DEFAULT_CONCURRENCY;

const markdownArg = process.argv.find(a => a.startsWith('--markdown='));
const markdownPath = markdownArg ? markdownArg.split('=').slice(1).join('=') : null;

main(concurrency, (result, completed, total) => {
  const progress = `[${completed}/${total}] ${result.name} - ${describe(result)}`;

  // Progress always goes to stderr, so --json's stdout stays clean and
  // pipeable while still showing live progress in a terminal. Completion
  // order isn't input order once checks run concurrently, so this counts
  // finished items rather than labeling which one.
  console.error(progress);

  if (!jsonMode && result.status === 'pending-release') {
    printPendingDetail(result);
  }
}).then(results => {
  if (markdownPath) {
    fs.appendFileSync(markdownPath, buildMarkdownReport(results) + '\n');
  }

  if (jsonMode) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  const pending = results.filter(r => r.status === 'pending-release');
  const upToDate = results.filter(r => r.status === 'up-to-date');
  const updatesAvailable = results.filter(r => r.updateAvailable);
  const issues = results.filter(r => ![ 'pending-release', 'up-to-date' ].includes(r.status));

  console.log(`\nChecked ${results.length} bpmn.io / Camunda dependencies.\n`);

  console.log(pending.length
    ? `Pending release (unreleased feat/fix/deps commits past the latest npm version): ${pending.length} (details above)`
    : 'No dependencies with pending feat/fix/deps commits found.');

  console.log(`Up to date (no unreleased feat/fix/deps commits): ${upToDate.length}`);

  if (updatesAvailable.length) {
    console.log(`\nAlready released upstream but not yet bumped here: ${updatesAvailable.length}`);

    for (const r of updatesAvailable) {
      console.log(`- ${r.name}: ${r.version} -> ${r.latestVersion}`);
    }
  }

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
