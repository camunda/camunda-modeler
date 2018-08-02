'use strict';

var browser = require('util/browser');

/**
 * File system API used by app.
 */
function FileSystem() {

  /**
   * Read file and callback with (err, file).
   *
   * @param {String} filePath
   * @param {Function} done
   */
  this.readFile = function(file, done) {
    browser.send('file:read', file, done);
  };


  /**
   * Read file attributes, but skip content.
   * Callback with (err, file).
   *
   * @param {String} filePath
   * @param {Function} done
   */
  this.readFileStats = function(file, done) {
    browser.send('file:read-stats', file, done);
  };



  /**
   * Write file and callback with (err, updatedFile).
   *
   * @param {File} file
   * @param {Function} done
   */
  this.writeFile = function(file, done) {
    browser.send('file:save', file, done);
  };
}

module.exports = FileSystem;
