/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

var NoneProvider = require('./providers/none-provider');

var ElementTemplatesProvider = require('./providers/element-templates-provider');


/**
 * A way to allow clients to retrieve configuration at run-time.
 *
 * @param {Object} options
 */
function ClientConfig(options) {

  this._providers = {
    '_': new NoneProvider(),
    'bpmn.elementTemplates': new ElementTemplatesProvider(options)
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