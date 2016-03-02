'use strict';

var spyOn = require('../../util/spy-on');


/**
 * Simple mock of electron's <Dialog> module
 */
function ElectronDialog() {

  this.openResponse = null;
  this.closeResponse = null;
  this.saveAsResponse = null;

  this.setResponse = function(fileOrError) {
    this.response = fileOrError;
  };


  this.showOpenDialog = function() {
    return this.response;
  };

  this.showSaveDialog = function() {
    return this.response;
  };

  this.showMessageBox = function() {
    return this.response;
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
