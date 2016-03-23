'use strict';

/**
 * A configuration that is provided
 * to the client during bootstrapping.
 */
function ClientConfig() {

  /**
   * Load the configuration.
   *
   * @return {Object}
   */
  this.load = function() {
    return {};
  };
}

module.exports = ClientConfig;