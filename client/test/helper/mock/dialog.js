'use strict';

var assign = require('lodash/object/assign');

var spyOn = require('test/helper/util/spy-on');


/**
 * A mock dialog implementation.
 */
function Dialog() {

  this.openResponse = null;
  this.closeResponse = null;
  this.saveAsResponse = null;
  this.namespaceResponse = null;
  this.reimportWarningResponse = null;

  this.setResponse = function(type, fileOrError) {
    this[type + 'Response'] = fileOrError;
  };


  /**
   * Ask for how to save the file and callback with (err, file).
   *
   * @param {File} file
   * @param {Function} done
   */
  this.saveAs = function(file, done) {

    if (this.saveAsResponse instanceof Error) {
      done(this.saveAsResponse);
    } else {
      done(null, assign({}, file, this.saveAsResponse));
    }
  };

  /**
   * Open save error dialog and callback with (err).
   *
   * @param {File} file
   * @param {Function} done
   */
  this.saveError = function(file, done) {
    done(null);
  };

  /**
   * Open an open dialog and callback with (err, file).
   *
   * @param {Function} done
   */
  this.open = function(done) {

    if (this.openResponse instanceof Error) {
      done(this.openResponse);
    } else {
      done(null, this.openResponse);
    }
  };

  /**
   * Display open error dialog and callback with (err).
   *
   * @param {Error} err
   * @param {Function} done
   */
  this.openError = function(err, done) {
    done(null);
  };

  /**
   * Open a 'close' dialog and callback with (err, file).
   *
   * @param {Function} done
   */
  this.close = function(file, done) {

    if (this.closeResponse instanceof Error) {
      done(this.closeResponse);
    } else {
      done(null, this.closeResponse);
    }
  };

  /**
   * Open a 'name' dialog and callback with (err, answer).
   *
   * @param {Function} done
  */
  this.convertNamespace = function(done) {

    if (this.namespaceResponse instanceof Error) {
      done(this.namespaceResponse);
    } else {
      done(null, this.namespaceResponse);
    }
  };

  /**
   * Open a 'name' dialog and callback with (err, answer).
   *
   * @param {Function} done
  */
  this.reimportWarning = function(done) {

    if (this.reimportWarningResponse instanceof Error) {
      done(this.reimportWarningResponse);
    } else {
      done(null, this.reimportWarningResponse);
    }
  };

  /**
   * Open unrecognized file error dialog and invoke callback with (err).
   *
   * @param {Function} done
   */
  this.unrecognizedFileError = function(file, done) {
    done(null);
  };

  /**
   * Displays an error that a diagram export has failed.
   *
   * @param {Error} err
   * @param {Function} done
   */
  this.exportError = function(err, done) {
    done(null);
  };

  /**
   * Displays an error that a diagram import has failed.
   *
   * @param {Error} err
   * @param {Function} done
   */
  this.importError = function(filename, trace, done) {
    done(null);
  };

  this._clear = function() {
    this._resetSpies();
  };

  this._resetSpies = spyOn(this);
}

module.exports = Dialog;
