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