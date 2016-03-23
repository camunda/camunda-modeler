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
   * Load the application configuration.
   *
   * The passed default result passed will be returned
   * if no configuration was provided.
   *
   * @param {Function} done
   */
  this.load = function(done) {
    browser.send('config:load', (err, config) => {

      if (!err) {
        this.setAll(config);
      }

      done(err);
    });
  };

}

inherits(ExternalConfig, BaseConfig);

module.exports = ExternalConfig;
