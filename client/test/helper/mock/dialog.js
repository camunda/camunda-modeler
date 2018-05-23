'use strict';

import {
  assign
} from 'min-dash';

var spyOn = require('test/helper/util/spy-on');

var BaseDialog = require('../../../lib/external/base-dialog');


/**
 * A mock dialog implementation.
 */
function Dialog(events) {

  BaseDialog.call(this, events);

  this.openResponse = null;
  this.closeResponse = null;
  this.saveAsResponse = null;
  this.exportAsResponse = null;
  this.savingDeniedResponse = null;
  this.namespaceResponse = null;
  this.reimportWarningResponse = null;
  this.contentChangedResponse = null;
  this.emptyFileResponse = null;

  this.setResponse = function(type, fileOrError) {
    this[type + 'Response'] = fileOrError;
  };


  this.contentChanged = function(done) {
    done(this.contentChangedResponse);
  };

  this._doOpen = function(args, callback) {
    var _args;

    args.shift();

    _args = args;

    if (!(args[0] instanceof Error)) {
      _args.unshift(null);
    }

    callback.apply(null, _args);
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
      // make sure we return with a proper
      // file.path (as we expect from an actual implementation)
      var response = null;
      if (this.saveAsResponse) {
        response = assign({}, file, this.saveAsResponse);
      }
      done(null, response);
    }
  };

  /**
   * Ask for how to export the given file and callback with (err, file).
   *
   * @param {File} file
   * @param {Array<String>} exportOptions
   * @param {Function} done
   */
  this.exportAs = function(file, exportOptions, done) {
    if (this.exportAsResponse instanceof Error) {
      done(this.exportAsResponse);
    } else {
      // make sure we return with a proper
      // file.path (as we expect from an actual implementation)
      var response = null;
      if (this.exportAsResponse) {
        response = assign({}, file, this.exportAsResponse);
      }
      done(null, response);
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
   * Open saving denied error dialog and callback with (err).
   *
   * @param {File} file
   * @param {Function} done
   */
  this.savingDenied = function(done) {
    if (this.savingDeniedResponse instanceof Error) {
      done(this.savingDeniedResponse);
    } else {
      done(null, this.savingDeniedResponse);
    }
  };

  /**
   * Open an open dialog and callback with (err, file).
   *
   * @param {Function} done
   */
  this.open = function(filePath, done) {
    this._open('file:open', this.openResponse, done);
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
  this.convertNamespace = function(type, done) {

    if (this.namespaceResponse instanceof Error) {
      done(this.namespaceResponse);
    } else {
      done(null, this.namespaceResponse);
    }
  };

  this.openEmptyFile = function(type, done) {
    if (this.emptyFileResponse instanceof Error) {
      done(this.emptyFileResponse);
    } else {
      done(null, this.emptyFileResponse);
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
