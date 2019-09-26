/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import {
  isNil,
  isString
} from 'min-dash';

const GET_CONFIG = 'config:get',
      SET_CONFIG = 'config:set';

/**
 * Get and set configuration through backend.
 */
export default class Config {

  /**
   * Constructor.
   *
   * @param {Object} backend
   */
  constructor(backend) {
    this.backend = backend;
  }

  /**
   * Get configuration value by key.
   *
   * @param {string} [key]
   * @param {...*} args
   *
   * @returns {Promise<*>}
   */
  get(key, ...args) {
    return this.backend.send(GET_CONFIG, key, ...args);
  }

  /**
   * Set a configuration value by key.
   *
   * @param {string} key
   * @param {...*} args
   *
   * @returns {Promise<*>}
   */
  set(key, ...args) {
    if (!isString(key)) {
      return Promise.reject(new Error('key must be string'));
    }

    return this.backend.send(SET_CONFIG, key, ...args);
  }

  /**
   * Get configuration value for file.
   *
   * @param {File} file
   * @param {string} [key]
   * @param {*} [defaultValue]
   *
   * @returns {Promise<*>}
   */
  async getForFile(file, key, defaultValue = null) {
    const { path } = file;

    const files = await this.get('files') || {};

    const configForFile = files[ path ];

    if (!configForFile) {
      return null;
    }

    if (!key) {
      return configForFile;
    }

    const value = configForFile[ key ];

    if (isNil(value)) {
      return defaultValue;
    }

    return value;
  }

  /**
   * Set configuration value for file.
   *
   * @param {File} file
   * @param {string} key
   * @param {*} value
   *
   * @returns {Promise<*>}
   */
  async setForFile(file, key, value) {
    const { path } = file;

    const files = await this.get('files') || {};

    const configForFile = files[ path ] = files[ path ] || {};

    configForFile[ key ] = value;

    await this.set('files', files);

    return configForFile;
  }

  /**
   * Get configuration value for plugin.
   *
   * @param {string} name
   * @param {string} [key]
   * @param {*} [defaultValue]
   *
   * @returns {Promise<*>}
   */
  async getForPlugin(name, key, defaultValue = null) {
    const plugins = await this.get('plugins') || {};

    const configForPlugin = plugins[ name ];

    if (!configForPlugin) {
      return null;
    }

    if (!key) {
      return configForPlugin;
    }

    const value = configForPlugin[ key ];

    if (isNil(value)) {
      return defaultValue;
    }

    return value;
  }

  /**
   * Set configuration value for plugin.
   *
   * @param {string} name
   * @param {string} key
   * @param {*} value
   *
   * @returns {Promise<*>}
   */
  async setForPlugin(name, key, value) {
    const plugins = await this.get('plugins') || {};

    const configForPlugin = plugins[ name ] = plugins[ name ] || {};

    configForPlugin[ key ] = value;

    await this.set('plugins', plugins);

    return configForPlugin;
  }

}
