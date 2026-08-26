#!/usr/bin/env node

/**
 * Compiles the list of bpmn.io / Camunda packages this project depends on -
 * directly or transitively - by scanning the root package-lock.json. A
 * transitive dependency can carry pending upstream fixes just as much as a
 * direct one, so this deliberately isn't limited to what's declared in the
 * workspaces' package.json files.
 *
 * Writes tasks/tracked-dependencies.json, consumed by
 * check-pending-releases.js. Re-run this after `npm install` changes the
 * lockfile.
 *
 * Usage:
 *   node tasks/list-tracked-dependencies.js
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const semver = require('semver');

const ROOT = path.join(__dirname, '..');
const OUTPUT_FILE = path.join(__dirname, 'tracked-dependencies.json');

const SCOPE_PREFIXES = [
  '@bpmn-io/',
  '@camunda/',
  'bpmn-js',
  'bpmn-moddle',
  'camunda-',
  'diagram-js',
  'dmn-js',
  'zeebe-',
  'modeler-moddle',
  'eslint-plugin-bpmn-io',
  'eslint-plugin-camunda-licensed',
  'remark-preset-bpmn-io'
];

function isTrackedPackage(name) {
  return SCOPE_PREFIXES.some(prefix => name.startsWith(prefix));
}

/**
 * Extracts the installed package name from a package-lock `packages` key,
 * e.g. "app/node_modules/foo/node_modules/@bpmn-io/bar" -> "@bpmn-io/bar".
 */
function nameFromLockKey(key) {
  const marker = 'node_modules/';
  const idx = key.lastIndexOf(marker);

  return idx === -1 ? null : key.slice(idx + marker.length);
}

/**
 * The root project and every npm workspace get their own entry in
 * `packages` (keyed by their path, e.g. "" for the root or "app"/"client"
 * for workspaces - the only keys that don't contain "node_modules/"), each
 * carrying its own `dependencies`/`devDependencies` - i.e. exactly what's
 * declared in that workspace's package.json. No need to read the
 * package.json files separately; the lockfile already has this.
 */
function collectDirectDependencyNames(lock) {
  const names = new Set();

  for (const [ key, entry ] of Object.entries(lock.packages)) {
    if (key.includes('node_modules/')) continue;

    for (const section of [ 'dependencies', 'devDependencies' ]) {
      for (const name of Object.keys(entry[section] || {})) {
        names.add(name);
      }
    }
  }

  return names;
}

function main() {
  const lock = JSON.parse(fs.readFileSync(path.join(ROOT, 'package-lock.json'), 'utf8'));
  const directNames = collectDirectDependencyNames(lock);

  const byName = new Map();

  for (const [ key, entry ] of Object.entries(lock.packages)) {
    const name = nameFromLockKey(key);

    if (!name || !isTrackedPackage(name) || !entry.version) continue;

    const existing = byName.get(name);

    if (!existing || semver.gt(entry.version, existing.version)) {
      byName.set(name, { version: entry.version, versions: existing ? existing.versions : [] });
    }

    if (!byName.get(name).versions.includes(entry.version)) {
      byName.get(name).versions.push(entry.version);
    }
  }

  const list = [ ...byName.entries() ]
    .map(([ name, info ]) => ({
      name,
      version: info.version,
      versions: info.versions.sort(semver.compare),
      direct: directNames.has(name)
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(list, null, 2) + '\n');

  const direct = list.filter(p => p.direct).length;
  const multiVersion = list.filter(p => p.versions.length > 1);

  console.log(`Wrote ${list.length} tracked packages to ${path.relative(ROOT, OUTPUT_FILE)}`);
  console.log(`  ${direct} direct, ${list.length - direct} transitive-only`);

  if (multiVersion.length) {
    console.log(`  ${multiVersion.length} installed at multiple versions (using the highest for each):`);

    for (const p of multiVersion) {
      console.log(`    - ${p.name}: ${p.versions.join(', ')}`);
    }
  }
}

main();
