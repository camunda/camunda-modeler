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
    console.log('[client-config]', 'load');

    return {};
  };
}

module.exports = ClientConfig;