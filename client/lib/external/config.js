'use strict';

var inherits = require('inherits');

var browser = require('util/browser');

var BaseConfig = require('../base/config');


/**
 * Config API used by app
 */
function ExternalConfig() {

  BaseConfig.call(this);

  /**
   * Get a configuration entry by key.
   *
   * @param {String} key
   * @param {Object...} arguments
   * @param {Function} done callback
   */
  this.get = function(key, done) {
    key = arguments[0];
    done = arguments[arguments.length - 1];

    if (typeof key !== 'string') {
      throw new Error('key must be a string');
    }

    if (typeof done !== 'function') {
      throw new Error('done callback must be a function');
    }

    var args = slice(arguments);

    browser.send.apply(browser, [ 'client-config:get' ].concat(args));
  };

}

inherits(ExternalConfig, BaseConfig);

module.exports = ExternalConfig;


// helpers /////////////////////

function slice(arr, begin, end) {
  return Array.prototype.slice.call(arr, begin, end);
}