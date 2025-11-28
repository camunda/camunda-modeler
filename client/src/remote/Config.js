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
      return defaultValue;
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

  async getFile(file) {
    const { path } = file;

    const files = await this.get('files') ;

    return files[ path ];
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

  async setFile(file,value) {
    const { path } = file;

    const files = await this.get('files') || {};

    files[ path ] = value;

    await this.set('files', files);

    return files[ path ];
  }

  async setDefault(key, value) {
    const defaults = await this.get('fileDefaults') || {};

    defaults[ key ] = value;

    await this.set('fileDefaults', defaults);

    return defaults;
  }

  async getDefault(key, defaultValue = null) {
    const defaults = await this.get('fileDefaults') || {};

    const value = defaults[ key ];

    return value || defaultValue;
  }

  async getDefaults() {
    return await this.get('fileDefaults') || {};
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
      return defaultValue;
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
