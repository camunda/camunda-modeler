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

/**
 * Number of directory entries to process before yielding to the event loop.
 */
const YIELD_EVERY_ENTRIES = 500;

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

    // default exclusions, overridable by any later matching positive pattern:
    // patterns behave as written, so `**/*` also selects inside `node_modules/`
    // and the root `camunda.json`
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

      // unlike c8ctl, compare the extension lower case, as Desktop Modeler
      // opens and indexes `.BPMN` files; `.c8ignore` patterns keep the case
      // handling of the shared pattern engine
      if (!DEFAULT_EXTENSIONS.includes(path.posix.extname(name).toLowerCase())) {
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

  // a single leading `/` anchors the pattern to the project root, as in
  // `.c8ignore`, it is never a file system path; absolute paths that can not
  // be anchors are invalid: drive letters, UNC roots and a leading backslash
  if (/^[a-zA-Z]:/.test(pattern) || pattern.startsWith('//') || pattern.startsWith('\\')) {
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
 * @param { {
 *   contents?: string,
 *   signal?: AbortSignal
 * } } [options] - contents of the project file, read from disk if omitted;
 *   abort to stop resolving, e.g. once superseded, rejects with the abort reason
 *
 * @return { Promise<ProjectResources> }
 */
async function resolveProjectResources(projectFilePath, options = {}) {
  const { signal } = options;

  const projectRoot = path.dirname(projectFilePath);

  let descriptor = null;

  if (path.basename(projectFilePath) === CAMUNDA_PROJECT_FILE) {
    let contents = options.contents;

    // an existing project file that can not be read (e.g. no permission, a
    // directory, or removed during an atomic save) fails the resolution,
    // rather than falling back to the default scan
    if (contents === undefined) {
      try {
        contents = decodeProjectFile(await fs.promises.readFile(projectFilePath));
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
      c8ignore = await readC8ignore(projectRoot);
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

  const selected = (await discover(projectRoot, selector, { signal })).sort();

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
 * Walk the project asynchronously, yielding to the event loop regularly so
 * that large projects do not block it. Directories nothing can be selected
 * from are not read.
 *
 * @param { string } projectRoot
 * @param { ResourceSelector } selector
 * @param { { signal?: AbortSignal } } [options] - abort to stop walking, e.g. once superseded
 *
 * @return { Promise<string[]> } absolute paths of selected files
 */
async function discover(projectRoot, selector, options = {}) {
  const { signal } = options;

  const candidates = [];

  // real paths of the directories on the current descent, to cut cycles; a
  // directory reachable through several paths (e.g. link and real path) is
  // walked under each, as patterns match project-relative paths
  const ancestors = new Set();

  let entryCount = 0;

  const checkpoint = async () => {
    if (++entryCount % YIELD_EVERY_ENTRIES === 0) {
      await yieldToEventLoop();
    }

    signal?.throwIfAborted();
  };

  const walk = async (directoryPath, relativeDirectory, realDirectory) => {
    if (ancestors.has(realDirectory)) {
      return;
    }

    let entries;

    try {
      entries = await fs.promises.readdir(directoryPath, { withFileTypes: true });
    } catch (error) {
      return;
    }

    entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

    ancestors.add(realDirectory);

    for (const entry of entries) {
      await checkpoint();

      const entryPath = path.join(directoryPath, entry.name);
      const relativePath = relativeDirectory ? `${ relativeDirectory }/${ entry.name }` : entry.name;

      let isDirectory = entry.isDirectory(),
          isFile = entry.isFile(),
          realPath = path.join(realDirectory, entry.name);

      // follow symbolic links (and entries of unknown type)
      if (entry.isSymbolicLink() || (!isDirectory && !isFile)) {
        try {
          const stats = await fs.promises.stat(entryPath);

          isDirectory = stats.isDirectory();
          isFile = stats.isFile();
          realPath = await fs.promises.realpath(entryPath);
        } catch (error) {

          // e.g. broken symbolic link
          continue;
        }
      }

      if (isDirectory) {
        if (!selector.isDirectoryExcluded(relativePath)) {
          await walk(entryPath, relativePath, realPath);
        }
      } else if (isFile && selector.isFileSelected(relativePath)) {
        candidates.push([ relativePath, entryPath, realPath ]);
      }
    }

    ancestors.delete(realDirectory);
  };

  await walk(projectRoot, '', await realpathOrSelf(projectRoot));

  // a file reachable through several paths is selected once, by the first
  // project-relative path in sorted order (as c8ctl)
  const seenFiles = new Set();

  return candidates
    .sort(([ a ], [ b ]) => (a < b ? -1 : a > b ? 1 : 0))
    .filter(([ , , realPath ]) => {
      if (seenFiles.has(realPath)) {
        return false;
      }

      seenFiles.add(realPath);

      return true;
    })
    .map(([ , entryPath ]) => entryPath);
}

function yieldToEventLoop() {
  return new Promise(resolve => setImmediate(resolve));
}

async function realpathOrSelf(filePath) {
  try {
    return await fs.promises.realpath(filePath);
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
 * @return { Promise<string | null> }
 *
 * @throws if `.c8ignore` exists but can not be read, e.g. it is a directory
 */
async function readC8ignore(projectRoot) {
  try {
    return await fs.promises.readFile(path.join(projectRoot, C8IGNORE_FILE), 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }

    throw error;
  }
}
