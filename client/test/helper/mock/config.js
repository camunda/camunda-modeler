'use strict';

function MockConfig() {

  this._providers = {};

  /**
   * Mocked {@link BaseConfig#get}.
   */
  this.get = function(key) {

    var done = arguments[arguments.length - 1];

    var fn = this._providers[key];

    if (fn) {
      // apply provider
      fn.apply(null, arguments);
    } else {
      // do nothing &-)
      done();
    }
  };

  this.provide = function(key, fn) {
    this._providers[key] = fn;
  };
}

module.exports = MockConfig;