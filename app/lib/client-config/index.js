'use strict';

var NoneProvider = require('./providers/none-provider');

var ElementTemplatesProvider = require('./providers/element-templates-provider');


/**
 * A way to allow clients to retrieve configuration
 * at run-time.
 *
 * @param {ElectronApplication} app
 */
function ClientConfig(app) {

  this._providers = {
    '_': new NoneProvider(),
    'bpmn.elementTemplates': new ElementTemplatesProvider(app)
  };

  /**
   * Retrieve a configuration entry.
   *
   * @param {String} key
   * @param {Object...} args
   * @param {Function} callback
   *
   * @return {Object}
   */
  this.get = function(key) {

    var provider = this._providers[key] || this._providers['_'];

    return provider.get.apply(provider, arguments);
  };
}

module.exports = ClientConfig;