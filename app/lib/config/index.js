/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const path = require('path');

const DefaultProvider = require('./providers/DefaultProvider');
const ElementTemplatesProvider = require('./providers/ElementTemplatesProvider');
const UUIDProvider = require('./providers/UUIDProvider');
const OSInfoProvider = require('./providers/OSInfoProvider');

const { isFunction } = require('min-dash');

/**
 * Configuration functionality. Gets/sets config from/to <userPath>/config.json by default.
 * Add provider for key for custom get/set functionality.
 */
class Config {
  constructor(options) {
    const {
      resourcesPaths,
      userPath
    } = options;

    const defaultProvider = this._defaultProvider = new DefaultProvider(path.join(userPath, 'config.json'));

    this._providers = {
      'bpmn.elementTemplates': new ElementTemplatesProvider(resourcesPaths, defaultProvider),
      'editor.id': new UUIDProvider(path.join(userPath, '.editorid')),
      'os.info': new OSInfoProvider()
    };
  }

  get(key, ...args) {
    const provider = this._providers[ key ] || this._defaultProvider;

    if (!isFunction(provider.get)) {
      throw new Error(`provider for <${ key }> cannot get`);
    }

    return provider.get(key, ...args);
  }

  set(key, value, ...args) {
    const provider = this._providers[ key ] || this._defaultProvider;

    if (!isFunction(provider.set)) {
      throw new Error(`provider for <${ key }> cannot set`);
    }

    return provider.set(key, value, ...args);
  }
}

module.exports = Config;
