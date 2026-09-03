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
    this._filesUpdate = Promise.resolve();
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
   * Get configuration or value for file.
   *
   * @param {File} file
   * @param {string} [key] if no key is provided returns the whole config for file
   * @param {*} [defaultValue]
   *
   * @returns {Promise<*>}
   */
  async getForFile(file, key, defaultValue = null) {
    const { path } = file;

    const files = await this.updateFiles(files => files);

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

  /**
   * Set configuration or value for file.
   *
   * @param {File} file
   * @param {string} [key] if no key is provided sets the whole config
   * @param {*} value
   *
   * @returns {Promise<*>}
   */
  async setForFile(file, key, value) {
    const { path } = file;

    const files = await this.updateFiles(files => {
      const nextFiles = { ...files };

      if (key) {
        nextFiles[ path ] = { ...nextFiles[ path ], [ key ]: value };
      } else {
        nextFiles[ path ] = value;
      }

      return nextFiles;
    });

    return files[ path ];
  }

  /**
   * Read and update file configuration, serialized to avoid overlapping
   * read/modify/write cycles.
   *
   * The updater must be synchronous; awaiting configuration from within it
   * would deadlock the queue. Return the passed files to skip writing.
   *
   * @param {(files: Object) => Object} updater
   *
   * @returns {Promise<Object>}
   */
  updateFiles(updater) {
    const update = async () => {
      const files = await this.get('files') || {};
      const nextFiles = updater(files);

      // an async updater would deadlock waiting on the queue it is running in
      if (nextFiles && typeof nextFiles.then === 'function') {
        throw new Error('updater must be synchronous');
      }

      if (nextFiles !== files) {
        await this.set('files', nextFiles);
      }

      return nextFiles;
    };

    const result = this._filesUpdate.then(update);

    this._filesUpdate = result.catch(() => {});

    return result;
  }

  /**
   * Get configuration or value for plugin.
   *
   * @param {string} name
   * @param {string} [key] if no key is provided returns the whole config for plugin
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
