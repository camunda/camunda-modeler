/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

'use strict';

var spyOn = require('../../util/spy-on');


/**
 * Simple mock of electron's <Dialog> module
 */
function ElectronDialog() {

  this.response = null;
  this.responses = null;

  this.setResponse = function(response) {
    if (Array.isArray(response)) {
      this.responses = [ ...response ];
    } else {
      this.response = response;
    }
  };

  this._nextResponse = function() {
    if (this.responses && this.responses.length) {
      return this.responses.shift();
    }

    return this.response;
  };

  this.showOpenDialog = function(browserWindow, opts) {
    return Promise.resolve(this._nextResponse());
  };

  this.showSaveDialog = function(browserWindow, opts) {
    return Promise.resolve(this._nextResponse());
  };

  this.showMessageBox = function(browserWindow, opts) {
    return Promise.resolve(this._nextResponse());
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
