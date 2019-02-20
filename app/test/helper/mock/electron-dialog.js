/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

var spyOn = require('../../util/spy-on');


/**
 * Simple mock of electron's <Dialog> module
 */
function ElectronDialog() {

  this.response = null;

  this.setResponse = function(fileOrError) {
    this.response = fileOrError;
  };

  this.showOpenDialog = function(browserWindow, opts, callback) {
    callback(this.response);
  };

  this.showSaveDialog = function(browserWindow, opts, callback) {
    callback(this.response);
  };

  this.showMessageBox = function(browserWindow, opts, callback) {
    callback(this.response);
  };

  this.showErrorBox = function(title, message) {
    return {
      title: title,
      message: message
    };
  };

  this._clear = function() {
    this.files = {};

    this._resetSpies();
  };

  this._resetSpies = spyOn(this);
}

module.exports = ElectronDialog;
