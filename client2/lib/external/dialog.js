'use strict';

var browser = require('util/browser');

var inherits = require('inherits');

var BaseDialog = require('./base-dialog');


/**
 * Dialog API used by app
 */
function Dialog(events) {

  BaseDialog.call(this, events);

  /**
   * Internally execute open. Whatever that means.
   *
   * @param {Array<Object>} args
   * @param {Function} callback
   */
  this._doOpen = function(args, callback) {
    browser.send.apply(null, [].concat(args, callback));
  };
}

inherits(Dialog, BaseDialog);

module.exports = Dialog;
