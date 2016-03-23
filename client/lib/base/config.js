'use strict';

var assign = require('lodash/object/assign');


/**
 * Config API used by app
 */
function Config() {

  this._entries = {};

  /**
   * Sets the available configuration entries.
   *
   * @param {String} key
   * @param {String} value
   */
  this.set = function(key, value) {
    this._entries[key] = value;
  };

  /**
   * Set a number of provided configuration entries.
   *
   * @param {Object} entries
   */
  this.setAll = function(entries) {
    this._entries = assign({}, this._entries, entries);
  };

  /**
   * Get a configuration entry by key.
   *
   * @param {String} key
   * @param {Object} defaultValue
   *
   * @return {}     [description]
   */
  this.get = function(key, defaultValue) {
    var value = this._entries[key];

    if (typeof value === 'undefined') {
      return defaultValue;
    } else {
      return value;
    }
  };

  /**
   * Load the configuration.
   *
   * Does nothing per default.
   *
   * @param {Function} done
   */
  this.load = function(done) {
    return done();
  };
}

module.exports = Config;