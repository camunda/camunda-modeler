'use strict';

const ipcRenderer = require('electron').ipcRenderer;
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
    ipcRenderer.once('file:save-as:res', function(event, err, args) {
      done(err, args);
    });
    ipcRenderer.send('file:save-as:req', true, file);
  };

  /**
   * Open save error dialog and callback with (err).
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
   * Open an open dialog and callback with (err, file).
   *
   * @param {Function} done
   */
  this.open = function(done) {
    ipcRenderer.once('file:open:res', function(event, err, args) {
      done(err, args);
    });
    ipcRenderer.send('file:open:req');
  };

  /**
   * Display open error dialog and callback with (err).
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
   * Open unrecognized file error dialog and invoke callback with (err).
   *
   * @param {Function} done
   */
  this.unrecognizedFileError = function(file, done) {
    debug('---> Dialog.unrecognizedFileError');
    // TODO: implement
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
  this.importError = function(err, done) {
    done(null);
  };
}

module.exports = Dialog;