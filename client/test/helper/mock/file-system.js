'use strict';

var assign = require('lodash/object/assign');

var spyOn = require('test/helper/util/spy-on');


/**
 * A recording mock file system implementation.
 */
function FileSystem() {

  this.file;
  this.statsFile;

  this.writeFileResponse = null;

  this.setResponse = function(type, fileOrError) {
    this[type + 'Response'] = fileOrError;
  };


  this.setFile = function(file) {
    this.file = file;
  };

  this.setStatsFile = function(file) {
    this.statsFile = file;
  };

  /**
   * Read file and callback with (err, readFile).
   *
   * @param {File} file
   * @param {Function} done
   */
  this.readFile = function(file, done) {
    done(null, assign({}, this.file));
  };

  /**
   * Write file and callback with (err, updatedFile).
   *
   * @param {File} file
   * @param {Function} done
   */
  this.writeFile = function(file, done) {

    if (this.writeFileResponse) {

      if (this.writeFileResponse instanceof Error) {
        done(this.writeFileResponse);
      } else {
        done(null, this.writeFileResponse);
      }
    }

    // make sure the file has a well defined
    // path after save (expected behavior...)
    if (file.path === '[unsaved]') {
      throw new Error('incorrect file path');
    }

    done(null, assign({}, file));
  };

  this.readFileStats = function(file, done) {
    done(null, assign({}, this.statsFile || {
      lastModified: new Date().getTime()
    }));
  };

  this._clear = function() {
    this.files = {};

    this._resetSpies();
  };

  this._resetSpies = spyOn(this);
}

module.exports = FileSystem;
