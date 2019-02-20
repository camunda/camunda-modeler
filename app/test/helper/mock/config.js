/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
