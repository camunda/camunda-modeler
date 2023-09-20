/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const { globSync } = require('fast-glob');

const path = require('path');
const fs = require('fs');

const { merge } = require('min-dash');

/**
 * Find JSON files in one or more paths. Return the merged result, the files
 * that were read and errors that occurred. Optionally, provide defaults that
 * will be merged into the result.
 *
 * @param {string} pattern
 * @param {Object} [options]
 * @param {string[]} [options.searchPaths]
 * @param {Object} [options.defaults]
 *
 * @example
 *
 * const {
 *   config,
 *   errors,
 *   files
 * } = globJSON('config.json', {
 *   searchPaths: [
 *     __dirname,
 *     process.cwd()
 *   ]
 * });
 *
 * @return { {
 *   config: Object,
 *   errors: Error[],
 *   files: string[]
 * } }
 */
function globJSON(pattern, options) {
  const {
    searchPaths,
    defaults = {}
  } = options;

  const files = globFiles(pattern, {
    searchPaths
  });

  const {
    contents,
    errors
  } = readJSON(files);

  const config = merge(defaults, ...contents);

  return {
    config,
    files,
    errors
  };
}

module.exports.globJSON = globJSON;


/**
 * Read the given files and return { contents: [], errors: [] }.
 *
 * @param  {Array<string>} files
 *
 * @return {Object}
 */
function readJSON(files) {
  return files.reduce((results, file) => {

    const {
      errors,
      contents
    } = results;

    try {
      const result = readFileAsJSON(file);

      return {
        errors,
        contents: [ ...contents, result ]
      };
    } catch (error) {
      return {
        errors: [ ...errors, error ],
        contents
      };
    }
  }, { errors: [], contents: [] });
}

module.exports.readJSON = readJSON;


function readFileAsJSON(file) {
  try {
    const contents = fs.readFileSync(file, { encoding: 'UTF-8' });

    return JSON.parse(contents);
  } catch (error) {
    throw new Error(`failed to process ${file}: ${error.message}`);
  }
}

/**
 * Find files matching a given pattern in one or more search paths.
 *
 * @param {string} pattern
 * @param {Object} [options]
 * @param {string[]} [options.searchPaths]
 * @param {boolean} [options.absolute=true]
 * @param {boolean} [options.onlyFiles=true]
 *
 * @return {string[]}
 */
function globFiles(pattern, options = {}) {
  const defaultOptions = {
    absolute: true,
    onlyFiles: true
  };

  const {
    searchPaths,
    cwd,
    ...otherOptions
  } = options;

  if (searchPaths) {
    return searchPaths.reduce((paths, searchPath) => {
      return [
        ...paths,
        ...globFiles(pattern, {
          ...otherOptions,
          cwd: searchPath
        })
      ];
    }, []);
  }

  const cwdOptions = cwd
    ? { cwd: toPosixPath(cwd) }
    : {};

  return globSync(toPosixPath(pattern), {
    ...defaultOptions,
    ...otherOptions,
    ...cwdOptions
  }).map(toPosixPath);
}

module.exports.globFiles = globFiles;

function toPosixPath(filePath) {
  return filePath.split(path.sep).join(path.posix.sep);
}

module.exports.toPosixPath = toPosixPath;
