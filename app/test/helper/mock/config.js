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
}

module.exports = Config;
