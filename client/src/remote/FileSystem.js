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
 * File system API used by app.
 */
export default class FileSystem {

  constructor(backend) {
    this.backend = backend;
  }

  /**
   * Read file.
   *
   * @param {String} filePath - Filepath.
   * @param {Object} [options] - Options.
   * @param {String} [options.encoding] - Encoding.
   *
   * @returns {Promise}
   */
  readFile(filePath, options = {}) {
    return this.backend.send('file:read', filePath, options);
  }

  /**
   * Read file lastModified.
   *
   * @param {Object} file - File.
   *
   * @returns {Promise}
   */
  readFileStats(file) {
    return this.backend.send('file:read-stats', file);
  }

  /**
   * Read directory list of files.
   * @param {String} dirPath - directory path
   * @param {Object} [options] - Options.
   * @param {String} [options.encoding] - Encoding.
   * @param {boolean} [options.withDirectories] - true to get directories listed
   *
   * @returns {Promise}
   */
  readDir(dirPath, options = {}) {
    return this.backend.send('file:read-dir', dirPath, options);
  }


  /**
   * Write file.
   *
   * @param {String} filePath - Filepath.
   * @param {Object} file - File.
   * @param {Object} [options] - Options.
   * @param {Object} [options.encoding] - Encoding.
   *
   * @returns {Promise}
   */
  writeFile(filePath, file, options = {}) {
    return this.backend.send('file:write', filePath, file, options);
  }

}
