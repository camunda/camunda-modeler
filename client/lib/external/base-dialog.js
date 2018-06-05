'use strict';

var debug = require('debug')('Dialog');

/**
 * Dialog API used by app
 */
function Dialog(events) {

  this._openDialogs = 0;

  this._closeOverlay = function() {
    this._openDialogs -= 1;

    // in case more than one dialog is opened
    // we only close the overlay when the last dialog is closed
    if (this._openDialogs === 0) {
      events.emit('dialog-overlay:toggle', false);
    }
  };

  this._showOverlay = function() {
    this._openDialogs += 1;

    if (this._openDialogs < 2) {
      events.emit('dialog-overlay:toggle', true);
    }
  };

  /**
   * Internally execute open. Whatever that means.
   *
   * @param {Array<Object>} args
   * @param {Function} callback
   */
  this._doOpen = function(args, callback) {
    throw new Error('sub-class responsibility');
  };

  this._open = function() {
    var self = this;

    var args = Array.prototype.slice.call(arguments),
        done = args.pop();

    if (typeof done !== 'function') {
      done = function() {};
    }

    function callback() {
      var doneArgs = Array.prototype.slice.call(arguments);

      self._closeOverlay();

      done.apply(null, doneArgs);
    }

    this._showOverlay();

    this._doOpen(args, callback);
  };

  /**
   * Ask for how to save the file and callback with (err, file).
   *
   * @param {File} file
   * @param {Array<FileFilter>} filters
   * @param {Function} done
   */
  this.exportAs = function(file, filters, done) {
    this._open('file:export-as', file, filters, done);
  };

  /**
   * Ask for how to save the file and callback with (err, file).
   *
   * @param {File} file
   * @param {Function} done
   */
  this.saveAs = function(file, done) {
    this._open('file:save-as', file, done);
  };

  /**
   * Open 'save error' dialog and callback with (err).
   *
   * @param {File} file
   * @param {Function} done
   */
  this.saveError = function(file, done) {
    debug('---> Dialog.saveError:', file);
    // TODO: implement
    done(null);
  };

  /**
   * Open an 'open' dialog and callback with (err, file).
   *
   * @param {Function} done
   */
  this.open = function(filePath, done) {
    this._open('file:open', filePath, done);
  };

  /**
   * Display 'open error' dialog and callback with (err).
   *
   * @param {Error} err
   * @param {Function} done
   */
  this.openError = function(err, done) {
    debug('---> Dialog.openError: ', err);

    // TODO(nikku): implement
    done(null);
  };

  /**
   * Display 'empty file' dialog and callback with (type).
   *
   * @param {Object} options
   * @param {String} options.fileType
   * @param {String} options.name
   * @param {Function} done
   */
  this.openEmptyFile = function(options, done) {
    this._open('dialog:empty-file', options, done);
  };

  /**
   * Open a 'close' dialog and callback with (err, file).
   *
   * @param {Function} done
   */
  this.close = function(file, done) {
    this._open('dialog:close-tab', file, done);
  };

  /**
   * Open 'unrecognized file error' dialog and invoke callback with (err).
   *
   * @param {Function} done
   */
  this.unrecognizedFileError = function(file, done) {
    this._open('dialog:unrecognized-file', file, done);
  };

  /**
   * Open 'reimport warning' dialog and invoke callback with (err, answer).
   *
   * @param {Function} done
   */
  this.reimportWarning = function(done) {
    this._open('dialog:reimport-warning', done);
  };

  /**
   * Open 'namespace' dialog and invoke callback with (err, answer).
   *
   * @param {Function} done
   */
  this.convertNamespace = function(type, done) {
    this._open('dialog:convert-namespace', type, done);
  };

  /**
   * Displays an error that a diagram export has failed.
   *
   * @param {Error} err
   * @param {Function} done
   */
  this.exportError = function(err, done) {
    // TODO(nikku): implement

    done(null);
  };

  /**
   * Displays an error that saving the diagram was denied.
   *
   * @param {Error} err
   * @param {Function} done
   */
  this.savingDenied = function(done) {
    this._open('dialog:saving-denied', done);
  };

  /**
   * Displays an error that a diagram import has failed.
   *
   * @param {Error} err
   * @param {Function} done
   */
  this.importError = function(filename, errorDetails, done) {
    this._open('dialog:import-error', filename, errorDetails, done);
  };

  /**
   * Displays a message indicating that content has been changed externally.
   * Callbacks with (err, answer).
   *
   * @param {Function} done
   */
  this.contentChanged = function(done) {
    this._open('dialog:content-changed', function(err, answer) {
      done(answer);
    });
  };
}

module.exports = Dialog;
