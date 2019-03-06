/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
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