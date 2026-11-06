/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/**
 * Gitignore-style pattern engine shared by `.c8ignore` and `deployResources`.
 *
 * This is a port of c8ctl's `.c8ignore` engine (`src/utils/shared/ignore.ts`),
 * built on `node:path#matchesGlob`, so that Desktop Modeler and c8ctl select
 * the same files for the same patterns. Anchoring, case handling, escaping and
 * the handling of dot-prefixed path segments are inherited from that engine.
 *
 * Paths passed in are project-root-relative and use `/` separators; directory
 * entries are queried with a trailing `/`.
 */

const { matchesGlob } = require('node:path');

/**
 * @typedef { {
 *   negate: boolean,
 *   globs: string[]
 * } } ParsedPattern
 */

/**
 * Translate a single gitignore-style line into one or more globs.
 *
 * - Blank lines and lines starting with `#` are skipped.
 * - A leading `!` negates the pattern.
 * - A trailing `/` restricts the pattern to directories (and their contents).
 * - A trailing `/**` matches everything inside the directory, but not the
 *   directory entry itself.
 * - A leading or embedded `/` anchors the pattern to the base directory,
 *   otherwise it matches at any depth.
 *
 * @param { string } raw
 *
 * @return { ParsedPattern | null }
 */
function parsePattern(raw) {
  const trimmed = raw.trimEnd();

  if (!trimmed || trimmed.startsWith('#')) {
    return null;
  }

  const negate = trimmed.startsWith('!');
  const withoutNegate = negate ? trimmed.slice(1) : trimmed;

  const dirOnly = withoutNegate.endsWith('/');
  const withoutTrailing = withoutNegate.replace(/\/$/, '');
  const pattern = withoutTrailing.replace(/^\//, '');

  if (!pattern) {
    return null;
  }

  const anchored = withoutNegate.startsWith('/') || pattern.includes('/');

  let globs;

  if (dirOnly) {
    globs = anchored
      ? [ `${ pattern }/**` ]
      : [ `${ pattern }/**`, `**/${ pattern }/**` ];
  } else if (pattern.endsWith('/**')) {
    const core = pattern.slice(0, -3);

    globs = [ `${ core }/*`, `${ core }/*/**` ];
  } else if (anchored) {
    globs = [ pattern, `${ pattern }/**` ];
  } else {
    globs = [ pattern, `**/${ pattern }`, `${ pattern }/**`, `**/${ pattern }/**` ];
  }

  return { negate, globs };
}

module.exports.parsePattern = parsePattern;

/**
 * @param { string } path
 * @param { ParsedPattern } pattern
 *
 * @return { boolean }
 */
function matchesPattern(path, pattern) {
  return pattern.globs.some(glob => matchesGlob(path, glob));
}

module.exports.matchesPattern = matchesPattern;

/**
 * Create an ignore checker with `.gitignore` semantics: last match wins, and a
 * negation cannot re-include a path whose parent directory is excluded.
 *
 * @param { ParsedPattern[] } patterns
 *
 * @return { (path: string) => boolean }
 */
function createIgnoreChecker(patterns) {

  // true when an ancestor directory of `path` is ignored by the first `upTo` patterns
  const isAncestorIgnored = (path, upTo) => {
    const segments = path.split('/');

    return segments.slice(1).some((_, depth) => {
      const ancestor = `${ segments.slice(0, depth + 1).join('/') }/`;

      return patterns
        .slice(0, upTo)
        .reduce((ignored, pattern) => matchesPattern(ancestor, pattern) ? !pattern.negate : ignored, false);
    });
  };

  return (path) => patterns.reduce((ignored, pattern, index) => {
    if (!matchesPattern(path, pattern)) {
      return ignored;
    }

    if (pattern.negate) {
      return isAncestorIgnored(path, index) ? ignored : false;
    }

    return true;
  }, false);
}

module.exports.createIgnoreChecker = createIgnoreChecker;

/**
 * Create a selection checker with allowlist semantics: selection starts empty,
 * positive patterns select, negated patterns deselect, the last match wins.
 *
 * Unlike `.gitignore`, a later positive pattern selects a path below an
 * earlier excluded directory directly.
 *
 * @param { ParsedPattern[] } patterns
 *
 * @return { (path: string) => boolean }
 */
function createSelectChecker(patterns) {
  return (path) => patterns.reduce((selected, pattern) => {
    return matchesPattern(path, pattern) ? !pattern.negate : selected;
  }, false);
}

module.exports.createSelectChecker = createSelectChecker;

/**
 * Check whether a glob could match a path below the given directory.
 * Conservative: returns `true` when in doubt.
 *
 * @param { string } glob
 * @param { string } dir - directory path without trailing slash
 *
 * @return { boolean }
 */
function couldMatchBelow(glob, dir) {

  // brace expansion may span path segments, do not reason about it
  if (/[{}]/.test(glob)) {
    return true;
  }

  const globSegments = glob.split('/');
  const dirSegments = dir.split('/');

  const match = (g, d) => {

    // directory consumed, the remaining glob must match something below it
    if (d === dirSegments.length) {
      return g < globSegments.length;
    }

    if (g === globSegments.length) {
      return false;
    }

    if (globSegments[ g ] === '**') {

      // `**` does not cross dot-prefixed segments, as in the engine
      return match(g + 1, d) || (!dirSegments[ d ].startsWith('.') && match(g, d + 1));
    }

    return matchesGlob(dirSegments[ d ], globSegments[ g ]) && match(g + 1, d + 1);
  };

  return match(0, 0);
}

module.exports.couldMatchBelow = couldMatchBelow;
