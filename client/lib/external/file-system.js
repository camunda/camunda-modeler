'use strict';

/**
 * File system API used by app.
 */
function FileSystem() {

  /**
   * Read file and callback with (err, readFile).
   *
   * @param {File} file
   * @param {Function} done
   */
  this.readFile = function(file, done) {

    // TODO: implement
    done(null, file);
  };

  /**
   * Write file and callback with (err, updatedFile).
   *
   * @param {File} file
   * @param {Function} done
   */
  this.writeFile = function(file, done) {

    // TODO: implement
    done(null, file);
  };
}

module.exports = FileSystem;