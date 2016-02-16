'use strict';

var assign = require('lodash/object/assign');

var spyOn = require('test/helper/util/spy-on');


/**
 * A recording mock file system implementation.
 */
function FileSystem() {

  this.files = {};

  /**
   * Set contents for files to be served.
   *
   * @param {Object} files { path -> contents } mapping
   */
  this.setFileContents = function(files) {
    assign(this.files, files);
  };

  /**
   * Read file and callback with (err, readFile).
   *
   * @param {File} file
   * @param {Function} done
   */
  this.readFile = function(file, done) {
    var contents = this.files[file.path];

    done(null, assign({}, file, { contents: contents }));
  };

  /**
   * Write file and callback with (err, updatedFile).
   *
   * @param {File} file
   * @param {Function} done
   */
  this.writeFile = function(file, done) {
    done(null, file);
  };

  this._clear = function() {
    this.files = {};

    this._resetSpies();
  };

  this._resetSpies = spyOn(this);
}

module.exports = FileSystem;