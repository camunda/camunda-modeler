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
   * Get values from `settings.json`.
   *
   * @returns {*}
   */
  get() {
    return super.get();
  }

  /**
   * Save values to `settings.json`.
   *
   * @param {*} values
   */
  set(_, values) {
    this._json = { ...this._json, ...values };
    this._writeFile();
  }
}

module.exports = SettingsProvider;
