/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const DefaultProvider = require('./DefaultProvider');

/**
 * Settings config provider. Reads and writes config to `settings.json`.
 */
class SettingsProvider extends DefaultProvider {

  constructor(path) {
    super(path);
  }

  /**
   * Get configuration value by key.
   *
   * @returns {*}
   */
  get() {
    const json = this._json || this._readFile();

    return json;
  }

  /**
   * Set a configuration value.
   *
   * @param {*} value
   */
  set(_, value) {
    this._json = value;

    this._writeFile();
  }
}

module.exports = SettingsProvider;
