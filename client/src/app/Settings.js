/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { forEach, reduce } from 'min-dash';

import { mapValues } from 'lodash';

import { Flags } from '../util';

/**
 * Metadata for a group of settings.
 *
 * @typedef {Object} SettingsGroup
 *
 * @property {string} id - unique identifier for the settings group
 * @property {string} title - title of the section on the settings page
 * @property {number} [order] - index of the section on the settings page
 * @property {Record<string, SettingsProperty>} properties - property key must be prefixed with
 * the group `id` e.g `bpmn.enabled`
 */

/**
 * Metadata for a single setting.
 *
 * @typedef {Object} SettingsProperty
 *
 * @property {'text' | 'password' | 'boolean' | 'select' | 'radio' | 'customField' | 'customFieldArray'} type - one of the supported types
 * @property {any} component - custom React component for 'customField' and 'customFieldArray' types
 * @property {string} label - label on the settings page
 * @property {string} [hint] - hint/placeholder for input based fields
 * @property {string|boolean} [default] - the default value
 * @property {Array<{label: string, value: string}>} [options] - options for select/radio type
 * @property {string} [flag] - indicates that the setting can be overridden by a flag
 * @property {string} [description] - description on the settings page
 * @property {boolean} [restartRequired] - is restart required to apply the setting
 * @property {string} [documentationUrl] - link to an external documentation
 * @property {import('../plugins/settings/SettingsForm').Condition} [condition]
 * @property {import('../plugins/settings/SettingsForm').Constraints} [constraints] - validation constraints for the field
 */

/**
 * Manages user settings.
 *
 * Provide new settings with the `register` function.
 *
 * You can get the setting value directly with `get`
 * or listen to the changes with `subscribe`.
 *
 * The settings are stored in the `settings.json` file,
 * but only the values that have been changed.
 */
export default class Settings {

  constructor(props) {

    const {
      config
    } = props;

    /**
     * Backend utility for `settings.json` file read and write.
     */
    this._configProvider = config;

    /**
     * Dictionary of all the provided settings metadata.
     * Key is the `id` of the settings group.
     *
     * @type { Record<string, SettingsGroup> }
     */
    this._settings = {};

    /**
     * Dictionary of setting keys and their default values, if provided.
     *
     * @type { Record<string, string|boolean> }
     */
    this._defaults = {};

    /**
     * Dictionary of all the settings keys and their values.
     * This is stored in the `settings.json` file.
     *
     * @type { Record<string, string|boolean>}
     */
    this._values = {};

    /**
     * Dictionary of setting keys and their listeners.
     * Listeners are called when the setting value changes.
     *
     * @type { Record<string, Array<function>> }
     */
    this._listeners = {};

    this._load();
  }

  /**
   * Register new settings.
   *
   * The settings are grouped by the `id` property.
   * You can reuse the `id` to add more settings to an existing group.
   *
   * The keys of the `properties` object must be prefixed with the `id` of the group.
   * e.g. if the `id` is `bpmn`, the keys must be `bpmn.enabled`, `bpmn.autoSave`, etc.
   *
   * @see Refer to {@link SettingsGroup} and {@link SettingsProperty} types for more details.
   *
   * @param { SettingsGroup } settings
   *
   * @returns { Record<string, string|boolean> } Dictionary of setting keys and their values.
  */
  register(settings) {
    const {
      id,
      title,
      order,
      properties
    } = settings;

    this._validate(settings);

    // Create a group if it does not exist
    if (!this._settings[id]) {

      this._settings[id] = { id, title, properties: {} };

      if (Number.isInteger(order)) {
        this._settings[id].order = order;
      }
    }

    // Append properties to the group
    forEach(properties, (property, key) => {

      this._settings[id].properties[key] = property;

      // Set the default value if provided
      this._defaults[key] = property.default;

      // Notify listeners if they subscribed before the setting was registered
      this._notify(key);
    });

    return reduce(properties, (acc, _, key) => {
      return { ...acc, [key]: this.get(key) };
    }, {});
  }

  _validate(settings) {
    const { id, properties } = settings;

    if (!id) {
      throw new Error('Settings group must have an ID');
    }

    forEach(properties, (_, key) => {

      if (!key.startsWith(`${id}.`)) {
        throw new Error(`Property key ${key} must start with group ID ${id}`);
      }

      if (this._settings[id]?.properties[key]) {
        throw new Error(`Setting with key ${key} is already registered`);
      }
    });
  }

  /**
   * Get value for the specified setting or all settings if no key is provided.
   *
   * If a setting is controlled by a flag and the flag is set,
   * the value of the flag is returned.
   *
   * @param { string } [key]
   * @returns { Record<string, string|boolean|Array>|string|boolean|Array }
   */
  get(key) {
    if (key) {
      return this._get(key);
    }

    return mapValues(this._defaults, (_, key) => this._get(key));
  }

  _get(key) {
    const schema = this.getSchema(key);

    if (!schema) {
      throw new Error(`Setting with key ${key} is not registered`);
    }

    const { flag } = schema;

    if (flag && Flags.get(flag) !== undefined) {
      return Flags.get(flag);
    }

    return this._values[key] ?? this._defaults[key];
  }

  /**
   * Get the metadata for the specified setting or all settings if no key is provided.
   *
   * @param { string } [key]
   * @returns { SettingsGroup }
   */
  getSchema(key) {
    const prefix = key ? key.split('.')[0] : null;
    return key ? this._settings[prefix]?.properties[key] : this._settings;
  }

  /**
   * Set the values for the specified settings.
   *
   * Calls the listeners for each setting that has changed. Saves the file.
   *
   * @param {Record<string, string|boolean>} settings - Dictionary of setting keys and their values.
   */
  set(settings) {

    forEach(settings, (value, key) => {
      if (this._values[key] === value) {
        return;
      }

      this._values[key] = value;
      this._notify(key);
    });

    this._save();
  }

  /**
   * Register a callback function that is called when the specified setting changes.
   *
   * @param { string } key - The setting key.
   * @param { (event:Object) => any } callback - A function to call with the new value.
   */
  subscribe(key, callback) {
    this._listeners[key] = [ ...(this._listeners[key] ?? []), callback ];
  }

  /**
   * Call all the listeners for the specified setting with the new value.
   *
   * @param {string} key
   */
  _notify(key) {
    forEach(this._listeners[key], listener => {
      listener({ value: this._get(key) });
    });
  }

  /**
   * Call all the listeners for all the settings.
   */
  _notifyAll() {
    Object.keys(this._listeners).forEach(key => {
      this._notify(key);
    });
  }

  /**
   * Load settings from the `settings.json` file.
   *
   * Calls all listeners.
   */
  async _load() {
    const jsonValues = await this._configProvider.get('settings');
    this._values = { ...this._values, ...jsonValues };

    this._notifyAll();
  }

  /**
   * Save current settings to the `settings.json` file.
   */
  _save() {
    this._configProvider.set('settings', this._values);
  }
}
