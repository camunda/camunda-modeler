'use strict';

var browser = require('util/browser');
var debug = require('debug')('Dialog');

/**
 * Dialog API used by app
 */
function Dialog() {

  /**
   * Ask for how to save the file and callback with (err, file).
   *
   * @param {File} file
   * @param {Function} done
   */
  this.saveAs = function(file, done) {
    browser.send('file:save-as', file, done);
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
  this.open = function(done) {
    browser.send('file:open', done);
  };

  /**
   * Display 'open error' dialog and callback with (err).
   *
   * @param {Error} err
   * @param {Function} done
   */
  this.openError = function(err, done) {
    debug('---> Dialog.openError: ', err);
    // TODO: implement
    done(null);
  };

  /**
   * Open a 'close' dialog and callback with (err, file).
   *
   * @param {Function} done
   */
  this.close = function(file, done) {
    browser.send('dialog:close-tab', file, done);
  };

  /**
   * Open 'unrecognized file error' dialog and invoke callback with (err).
   *
   * @param {Function} done
   */
  this.unrecognizedFileError = function(file, done) {
    browser.send('dialog:unrecognized-file', file, done);
  };

  /**
   * Open 'reimport warning' dialog and invoke callback with (err, answer).
   *
   * @param {Function} done
   */
  this.reimportWarning = function(done) {
    browser.send('dialog:reimport-warning', done);
  };

  /**
   * Open 'namespace' dialog and invoke callback with (err, answer).
   *
   * @param {Function} done
   */
  this.convertNamespace = function(done) {
    browser.send('dialog:convert-namespace', done);
  };

  /**
   * Open 'unrecognized file error' dialog and invoke callback with (err).
   *
   * @param {Function} done
   */
  this.name = function(file, done) {
    browser.send('dialog:unrecognized-file', file, done);
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
   * Displays an error that saving the diagram was denied.
   *
   * @param {Error} err
   * @param {Function} done
   */
  this.savingDenied = function(done) {
    browser.send('dialog:saving-denied', done);
  };

  /**
   * Displays an error that a diagram import has failed.
   *
   * @param {Error} err
   * @param {Function} done
   */
  this.importError = function(filename, errorDetails, done) {
    browser.send('dialog:import-error', [ filename, errorDetails ], done);
  };

  /**
   * Displays a message indicating that content has been changed externally.
   * Callbacks with (err, answer).
   *
   * @param {Function} done
   */
  this.contentChanged = function(done) {
    browser.send('dialog:content-changed', function functionName(err, answer) {
      done(answer);
    });
  };
}

module.exports = Dialog;
