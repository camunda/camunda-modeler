/**
 * File system API used by app.
 */
export default class FileSystem {

  constructor(backend) {
    this.backend = backend;
  }

  /**
   * Read file and return it.
   *
   * @param {String} filePath
   */
  readFile(filePath) {
    return this.backend.send('file:read', filePath);
  }

  /**
   * Read file attributes, but skip content.
   *
   * @param {String} filePath
   */
  readFileStats(filePath) {
    return this.backend.send('file:read-stats', filePath);
  }


  /**
   * Write file and return a promise for the written file.
   *
   * @param {File} file
   * @param {Object} options
   */
  writeFile(file, options) {

    const action = options && options.saveAs ? 'file:save-as' : 'file:save';

    return this.backend.send(action, file);
  }

}