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


function Config() {
  this._data = {};

  this.get = function(key, defaultValue) {
    var result = this._data[key];

    if (result !== undefined) {
      return result;
    } else {
      return defaultValue;
    }
  };

  this.set = function(key, value) {
    this._data[key] = value;
  };

  this.getFile = function(file) {
    const files = this._data.files || {};
    return files[file.path];
  };

  this.setFile = function(file, value) {
    this._data.files = this._data.files || {};
    this._data.files[file.path] = value;
  };

  this.getDefaults = function() {
    return this._data.fileDefaults || {};
  };

  this.setDefaults = function(value) {
    this._data.fileDefaults = value;
  };

  this.getDefault = function(key, defaultValue) {
    const defaults = this._data.fileDefaults || {};
    const result = defaults[key];
    return result !== undefined ? result : defaultValue;
  };

  this.setDefault = function(key, value) {
    this._data.fileDefaults = this._data.fileDefaults || {};
    this._data.fileDefaults[key] = value;
  };
}

module.exports = Config;
