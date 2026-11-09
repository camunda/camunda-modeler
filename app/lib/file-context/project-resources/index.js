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
 * Resolution of the resources of a Camunda project, i.e. the files deployed
 * with the project. They define project membership: editor intelligence,
 * deployment, run and task testing operate on them.
 *
 * - With `deployResources` in `camunda.json`, the listed patterns select the
 *   resources (allowlist), and `.c8ignore` does not apply.
 * - Without it, the default scan applies (known resource extensions,
 *   no hidden files), filtered by `.c8ignore`.
 *
 * Both match c8ctl, cf. https://github.com/camunda/product-hub/issues/3888.
 */

const fs = require('node:fs');
const path = require('node:path');

const {
  couldMatchBelow,
  createIgnoreChecker,
  createSelectChecker,
  parsePattern
} = require('./patterns');

const CAMUNDA_PROJECT_FILE = 'camunda.json';
const C8IGNORE_FILE = '.c8ignore';

/**
 * Excluded unless overridden, in both modes.
 */
const DEFAULT_EXCLUSIONS = [ 'node_modules/', 'target/', '.git/' ];

/**
 * Extensions of the default scan.
 */
const DEFAULT_EXTENSIONS = [ '.bpmn', '.dmn', '.form', '.rpa' ];

const ERROR_INVALID_CONFIG = 'invalid-config';
const ERROR_EMPTY_SELECTION = 'empty-selection';

const MODE_DEPLOY_RESOURCES = 'deployResources';
const MODE_C8IGNORE = 'c8ignore';

module.exports.CAMUNDA_PROJECT_FILE = CAMUNDA_PROJECT_FILE;
module.exports.C8IGNORE_FILE = C8IGNORE_FILE;
module.exports.DEFAULT_EXCLUSIONS = DEFAULT_EXCLUSIONS;
module.exports.DEFAULT_EXTENSIONS = DEFAULT_EXTENSIONS;
module.exports.MODE_DEPLOY_RESOURCES = MODE_DEPLOY_RESOURCES;
module.exports.MODE_C8IGNORE = MODE_C8IGNORE;
module.exports.ERROR_INVALID_CONFIG = ERROR_INVALID_CONFIG;
module.exports.ERROR_EMPTY_SELECTION = ERROR_EMPTY_SELECTION;

/**
 * @typedef { {
 *   mode: 'deployResources' | 'c8ignore',
 *   error?: string,
 *   isDirectoryExcluded?: (relativePath: string) => boolean,
 *   isFileSelected?: (relativePath: string) => boolean
 * } } ResourceSelector
 *
 * @typedef { {
 *   mode: 'deployResources' | 'c8ignore',
 *   selected: string[],
 *   error: string | null,
 *   errorType?: 'invalid-config' | 'empty-selection'
 * } } ProjectResources
 */

/**
 * Create a selector for the resources of a project.
 *
 * @param { Object | null } descriptor - parsed `camunda.json`, `null` for a legacy project
 * @param { string | null } [c8ignore] - contents of `.c8ignore`, if any
 *
 * @return { ResourceSelector }
 */
function createResourceSelector(descriptor, c8ignore = null) {
  if (hasDeployResources(descriptor)) {
    return createDeployResourcesSelector(descriptor.deployResources);
  }

  return createC8ignoreSelector(c8ignore);
}

module.exports.createResourceSelector = createResourceSelector;

/**
 * @param { any } deployResources
 *
 * @return { ResourceSelector }
 */
function createDeployResourcesSelector(deployResources) {
  const mode = MODE_DEPLOY_RESOURCES;

  const error = validateDeployResources(deployResources);

  if (error) {
    return { mode, error };
  }

  const userPatterns = deployResources.map(parsePattern);

  const patterns = [

    // default exclusions, overridable by a later matching positive pattern
    ...DEFAULT_EXCLUSIONS.map(exclusion => parsePattern(`!${ exclusion }`)),
    { negate: true, globs: [ CAMUNDA_PROJECT_FILE ] },
    ...userPatterns
  ];

  const isSelected = createSelectChecker(patterns);

  const positiveGlobs = userPatterns
    .filter(pattern => !pattern.negate)
    .flatMap(pattern => pattern.globs);

  return {
    mode,

    // only skip directories nothing could be selected from; a positive
    // pattern selects descendants of excluded directories directly
    isDirectoryExcluded: (relativePath) => !positiveGlobs.some(glob => couldMatchBelow(glob, relativePath)),
    isFileSelected: (relativePath) => isSelected(relativePath)
  };
}

/**
 * @param { string | null } c8ignore
 *
 * @return { ResourceSelector }
 */
function createC8ignoreSelector(c8ignore) {
  const lines = [
    ...DEFAULT_EXCLUSIONS,
    ...(c8ignore ? c8ignore.split('\n') : [])
  ];

  const isIgnored = createIgnoreChecker(lines.map(parsePattern).filter(Boolean));

  return {
    mode: MODE_C8IGNORE,

    // an excluded directory is not traversed, so its contents can not be re-included
    isDirectoryExcluded: (relativePath) => isIgnored(`${ relativePath }/`),
    isFileSelected: (relativePath) => {
      const name = path.posix.basename(relativePath);

      if (name.startsWith('.') || name === CAMUNDA_PROJECT_FILE) {
        return false;
      }

      if (!DEFAULT_EXTENSIONS.includes(path.posix.extname(name))) {
        return false;
      }

      return !isIgnored(relativePath);
    }
  };
}

/**
 * Validate the `deployResources` field.
 *
 * @param { any } deployResources
 *
 * @return { string | null } error
 */
function validateDeployResources(deployResources) {
  if (!Array.isArray(deployResources)) {
    return 'Invalid camunda.json: `deployResources` must be an array of glob patterns.';
  }

  for (const [ index, entry ] of deployResources.entries()) {
    const error = validatePattern(entry);

    if (error) {
      return `Invalid camunda.json: \`deployResources[${ index }]\` ${ error }.`;
    }
  }

  return null;
}

module.exports.validateDeployResources = validateDeployResources;

/**
 * @param { any } entry
 *
 * @return { string | null } error
 */
function validatePattern(entry) {
  if (typeof entry !== 'string') {
    return 'must be a string';
  }

  // validate what is matched, trailing whitespace is trimmed
  const trimmed = entry.trimEnd();

  const pattern = trimmed.startsWith('!') ? trimmed.slice(1) : trimmed;

  if (!pattern.trim()) {
    return 'must not be empty';
  }

  if (trimmed.startsWith('#')) {
    return `must be a glob pattern, got comment "${ entry }"`;
  }

  if (/^([/\\]|[a-zA-Z]:)/.test(pattern)) {
    return `must be relative to the project root, got "${ entry }"`;
  }

  if (pattern.split(/[/\\]/).includes('..')) {
    return `must not contain "..", got "${ entry }"`;
  }

  if (!parsePattern(entry)) {
    return `is not a valid pattern, got "${ entry }"`;
  }

  return null;
}

/**
 * Select resources from a list of project-relative file paths, applying the
 * same rules as discovery on the file system.
 *
 * @param { string[] } relativePaths
 * @param { Object | null } descriptor
 * @param { string | null } [c8ignore]
 *
 * @return { ProjectResources }
 */
function selectResources(relativePaths, descriptor, c8ignore = null) {
  const selector = createResourceSelector(descriptor, c8ignore);

  if (selector.error) {
    return { mode: selector.mode, selected: [], error: selector.error, errorType: ERROR_INVALID_CONFIG };
  }

  const selected = relativePaths.filter(relativePath => {
    const segments = relativePath.split('/');

    const ancestors = segments.slice(0, -1).map((_, index) => segments.slice(0, index + 1).join('/'));

    return !ancestors.some(selector.isDirectoryExcluded) && selector.isFileSelected(relativePath);
  }).sort();

  return withEmptySelectionError({ mode: selector.mode, selected, error: null });
}

module.exports.selectResources = selectResources;

/**
 * Resolve the resources of the project defined by the given project file
 * (`camunda.json` or legacy `.process-application`) from the file system.
 *
 * Symbolic links are followed; a file reachable through several paths is
 * selected once, by the first project-relative path in sorted order
 * (realpath-based, as in c8ctl).
 *
 * @param { string } projectFilePath
 * @param { { contents?: string } } [options] - contents of the project file, read from disk if omitted
 *
 * @return { ProjectResources }
 */
function resolveProjectResources(projectFilePath, options = {}) {
  const projectRoot = path.dirname(projectFilePath);

  let descriptor = null;

  if (path.basename(projectFilePath) === CAMUNDA_PROJECT_FILE) {
    let contents = options.contents;

    // an existing project file that can not be read (e.g. no permission, a
    // directory, or removed during an atomic save) fails the resolution,
    // rather than falling back to the default scan
    if (contents === undefined) {
      try {
        contents = decodeProjectFile(fs.readFileSync(projectFilePath));
      } catch (error) {
        return {
          mode: MODE_C8IGNORE,
          selected: [],
          error: `Failed to read camunda.json: ${ error.message }`,
          errorType: ERROR_INVALID_CONFIG
        };
      }
    }

    try {
      descriptor = contents.trim() ? JSON.parse(contents) : {};
    } catch (error) {
      return {
        mode: MODE_C8IGNORE,
        selected: [],
        error: `Invalid camunda.json: ${ error.message }`,
        errorType: ERROR_INVALID_CONFIG
      };
    }

    if (!descriptor || typeof descriptor !== 'object' || Array.isArray(descriptor)) {
      return {
        mode: MODE_C8IGNORE,
        selected: [],
        error: 'Invalid camunda.json: must contain a JSON object.',
        errorType: ERROR_INVALID_CONFIG
      };
    }
  }

  let c8ignore = null;

  // `.c8ignore` applies without `deployResources` only; failing to read it
  // fails the resolution, rather than deploying files meant to be excluded
  if (!hasDeployResources(descriptor)) {
    try {
      c8ignore = readC8ignore(projectRoot);
    } catch (error) {
      return {
        mode: MODE_C8IGNORE,
        selected: [],
        error: `Failed to read ${ C8IGNORE_FILE }: ${ error.message }`,
        errorType: ERROR_INVALID_CONFIG
      };
    }
  }

  const selector = createResourceSelector(descriptor, c8ignore);

  if (selector.error) {
    return { mode: selector.mode, selected: [], error: selector.error, errorType: ERROR_INVALID_CONFIG };
  }

  const selected = discover(projectRoot, selector).sort();

  return withEmptySelectionError({ mode: selector.mode, selected, error: null });
}

module.exports.resolveProjectResources = resolveProjectResources;

/**
 * @param { ProjectResources } resources
 *
 * @return { ProjectResources }
 */
function withEmptySelectionError(resources) {
  if (resources.selected.length) {
    return resources;
  }

  return {
    ...resources,
    errorType: ERROR_EMPTY_SELECTION,
    error: resources.mode === MODE_DEPLOY_RESOURCES
      ? 'No deployable files found: `deployResources` in camunda.json selects no files.'
      : 'No deployable files found in the project.'
  };
}

/**
 * Walk the project, files of a directory first, then its sub-directories.
 *
 * @param { string } projectRoot
 * @param { ResourceSelector } selector
 *
 * @return { string[] } absolute paths of selected files
 */
function discover(projectRoot, selector) {
  const candidates = [];

  // real paths of the directories on the current descent, to cut cycles; a
  // directory reachable through several paths (e.g. link and real path) is
  // walked under each, as patterns match project-relative paths
  const ancestors = new Set();

  const walk = (directoryPath, relativeDirectory) => {
    const realDirectory = realpathOrSelf(directoryPath);

    if (ancestors.has(realDirectory)) {
      return;
    }

    let entries;

    try {
      entries = fs.readdirSync(directoryPath).sort();
    } catch (error) {
      return;
    }

    ancestors.add(realDirectory);

    for (const entry of entries) {
      const entryPath = path.join(directoryPath, entry);
      const relativePath = relativeDirectory ? `${ relativeDirectory }/${ entry }` : entry;

      let stats;

      try {
        stats = fs.statSync(entryPath);
      } catch (error) {

        // e.g. broken symbolic link
        continue;
      }

      if (stats.isDirectory()) {
        if (!selector.isDirectoryExcluded(relativePath)) {
          walk(entryPath, relativePath);
        }
      } else if (stats.isFile() && selector.isFileSelected(relativePath)) {
        candidates.push([ relativePath, entryPath ]);
      }
    }

    ancestors.delete(realDirectory);
  };

  walk(projectRoot, '');

  // a file reachable through several paths is selected once, by the first
  // project-relative path in sorted order (as c8ctl)
  const seenFiles = new Set();

  return candidates
    .sort(([ a ], [ b ]) => (a < b ? -1 : a > b ? 1 : 0))
    .filter(([ , entryPath ]) => {
      const realFile = realpathOrSelf(entryPath);

      if (seenFiles.has(realFile)) {
        return false;
      }

      seenFiles.add(realFile);

      return true;
    })
    .map(([ , entryPath ]) => entryPath);
}

function realpathOrSelf(filePath) {
  try {
    return fs.realpathSync(filePath);
  } catch (error) {
    return filePath;
  }
}

/**
 * Decode `camunda.json`, tolerating the byte order marks Windows tools
 * write, as c8ctl: UTF-8 (stripped) and UTF-16LE (decoded).
 *
 * @param { Buffer } buffer
 *
 * @return { string }
 */
function decodeProjectFile(buffer) {
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return buffer.subarray(2).toString('utf16le');
  }

  return buffer.toString('utf8').replace(/^\uFEFF/, '');
}

/**
 * @param { Object | null } descriptor
 *
 * @return { boolean }
 */
function hasDeployResources(descriptor) {
  return !!descriptor && Object.prototype.hasOwnProperty.call(descriptor, 'deployResources');
}

/**
 * Read `.c8ignore` of a project, `null` if there is none.
 *
 * @param { string } projectRoot
 *
 * @return { string | null }
 *
 * @throws if `.c8ignore` exists but can not be read, e.g. it is a directory
 */
function readC8ignore(projectRoot) {
  try {
    return fs.readFileSync(path.join(projectRoot, C8IGNORE_FILE), 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }

    throw error;
  }
}
