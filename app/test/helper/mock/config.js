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
