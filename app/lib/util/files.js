/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const glob = require('glob');

const fs = require('fs');

/**
 * Load JSON configuration from multiple paths.
 *
 * @example
 *
 * const {
 *   errors,
 *   files,
 *   config
 * } = globJSON({
 *   name: 'config.json',
 *   searchPaths: [ __dirname, process.cwd() ]
 * });
 *
 * @return { config, files, errors }
 */
function globJSON(options) {

  const {
    name,
    pattern,
    searchPaths,
    defaults
  } = options;

  const files = globFiles({
    searchPaths,
    pattern: name || pattern
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


function merge(...objects) {
  return Object.assign({}, ...objects);
}

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
 * Find files by pattern in a list of search paths.
 *
 * @param {Object} options
 * @param {Array<string>} options.searchPaths
 * @param {string} options.pattern
 *
 * @return {Array<string>} list of found, absolute path names
 */
function globFiles(options) {

  const {
    searchPaths,
    pattern
  } = options;

  return searchPaths.reduce((paths, searchPath) => {

    const newPaths = glob.sync(pattern, {
      cwd: searchPath,
      nodir: true,
      realpath: true
    });

    return [
      ...paths,
      ...newPaths
    ];
  }, []);

}

module.exports.globFiles = globFiles;