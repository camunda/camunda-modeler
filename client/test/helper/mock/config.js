'use strict';

var inherits = require('inherits');

var BaseConfig = require('base/config');

/**
 * Config Mock API used by app
 */
function MockConfig() {

  BaseConfig.call(this);

  this.setLoadResult = function(loadResult) {
    this._loadResult = loadResult;
  };

  /**
   * Mocked {Config#load}.
   */
  this.load = function(done) {
    var loadResult = this._loadResult;

    if (loadResult instanceof Error) {
      return done(loadResult);
    }

    this.setAll(loadResult);

    return done(null);
  };
}

inherits(MockConfig, BaseConfig);

module.exports = MockConfig;
