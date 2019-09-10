/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const fs = require('fs');

const log = require('../../log')('app:config:default');

const { isNil } = require('min-dash');

/**
 * Default config provider. Reads and writes config to `config.json` under `userPath`.
 */
class DefaultProvider {
  constructor(path) {
    this._path = path;

    this._json = null;
  }

  /**
   * Get configuration value by key.
   *
   * @param {string} [key]
   * @param {*} [defaultValue]
   *
   * @returns {*}
   */
  get(key, defaultValue = null) {
    const json = this._json || this._readFile();

    if (!key) {
      return json;
    }

    const value = json[ key ];

    if (isNil(value)) {
      return defaultValue;
    }

    return value;
  }

  _readFile() {
    try {
      return JSON.parse(fs.readFileSync(this._path, 'utf8'));
    } catch (error) {

      // do not throw if no such file
      if (error.code === 'ENOENT') {
        return {};
      }

      this._json = null;

      log.error(`cannot read file ${ this._path }`, error);

      throw new Error(`cannot read file ${ this._path }`);
    }
  }

  /**
   * Set a configuration value by key.
   *
   * @param {string} keys
   * @param {*} value
   */
  set(key, value) {
    const json = this._json = this._json || this._readFile();

    json[ key ] = value;

    this._writeFile();
  }

  _writeFile() {
    try {
      fs.writeFileSync(this._path, JSON.stringify(this._json, null, 2), 'utf8');
    } catch (error) {
      log.error(`cannot write file ${ this.path }`, error);

      throw new Error(`cannot write file ${ this.path }`);
    }
  }
}

module.exports = DefaultProvider;