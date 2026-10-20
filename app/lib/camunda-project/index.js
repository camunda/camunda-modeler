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

const fs = require('fs');
const path = require('path');

const ignore = require('ignore');

const RESOURCES_DIRECTORY = 'resources';

const IGNORE_FILE = '.c8ignore';

// ignored with or without `.c8ignore`, as in c8ctl
const DEFAULT_IGNORE_PATTERNS = [
  'node_modules/',
  'target/',
  '.git/'
];

/**
 * Get the files a Camunda project deploys: the given project files, and every
 * file in the `resources` directory of the project, such as scripts. Files
 * matching a pattern of the `.c8ignore` file at the root of the project
 * (`.gitignore` syntax) are left out, as are hidden files and symbolic links.
 *
 * @example
 *
 * project/
 * ├── camunda.json
 * ├── .c8ignore           # e.g. `*.test.js`
 * ├── process.bpmn
 * └── resources/
 *     └── scripts/
 *         └── sum.js
 *
 * @param {string} projectFilePath - path of the project file, e.g. `camunda.json`
 * @param {string[]} [filePaths] - project files, e.g. diagrams
 *
 * @returns {Promise<{ files: string[], resources: string[] }>}
 */
async function getDeploymentFiles(projectFilePath, filePaths = []) {
  const projectDirectory = path.dirname(projectFilePath);

  const ignored = getIgnoreRules(projectDirectory);

  const isIgnored = (filePath, isDirectory = false) => {
    const relativePath = toRelativePath(projectDirectory, filePath);

    if (!relativePath) {
      return true;
    }

    return ignored.ignores(isDirectory ? `${ relativePath }/` : relativePath);
  };

  const files = filePaths.filter(filePath => !isIgnored(filePath));

  const filePathKeys = filePaths.map(toPathKey);

  // a diagram may be both a project file and a resource
  const resources = (await findFiles(path.join(projectDirectory, RESOURCES_DIRECTORY), isIgnored))
    .filter(resource => !filePathKeys.includes(toPathKey(resource)));

  return {
    files,
    resources
  };
}

module.exports.getDeploymentFiles = getDeploymentFiles;

function getIgnoreRules(projectDirectory) {
  const ignored = ignore().add(DEFAULT_IGNORE_PATTERNS);

  try {
    ignored.add(fs.readFileSync(path.join(projectDirectory, IGNORE_FILE), 'utf8'));
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }

  return ignored;
}

/**
 * Find the files of a directory, at any depth, without following symbolic
 * links, so that only files inside the directory are found.
 *
 * @param {string} directory
 * @param {(path: string, isDirectory: boolean) => boolean} isIgnored
 *
 * @returns {Promise<string[]>}
 */
async function findFiles(directory, isIgnored) {
  let entries;

  try {
    entries = await fs.promises.readdir(directory, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT' || err.code === 'ENOTDIR') {
      return [];
    }

    throw err;
  }

  const files = [];

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name.startsWith('.')) {
      continue;
    }

    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory() && !isIgnored(entryPath, true)) {
      files.push(...await findFiles(entryPath, isIgnored));
    } else if (entry.isFile() && !isIgnored(entryPath)) {
      files.push(entryPath);
    }
  }

  return files;
}

/**
 * @param {string} filePath
 *
 * @returns {string} key that is equal for two paths of the same file
 */
function toPathKey(filePath) {
  const resolvedPath = path.resolve(filePath);

  return process.platform === 'win32' ? resolvedPath.toLowerCase() : resolvedPath;
}

/**
 * @param {string} directory
 * @param {string} filePath
 *
 * @returns {string|null} path relative to the directory with `/` separators,
 * or `null` if the path is not inside the directory
 */
function toRelativePath(directory, filePath) {
  const relativePath = path.relative(directory, filePath);

  if (
    !relativePath ||
    relativePath === '..' ||
    relativePath.startsWith(`..${ path.sep }`) ||
    path.isAbsolute(relativePath)
  ) {
    return null;
  }

  return relativePath.split(path.sep).join('/');
}
