/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { forEach, isArray } from 'min-dash';

/**
 * Metadata for a group of settings.
 *
 * @typedef {Object} SettingsGroup
 *
 * @property {string} id - unique identifier for the settings group. Can be reused to add more settings to an existing group.
 * @property {string} title - title of the section on the settings page
 * @property {Object.<string, SettingsProperty>} properties - property key must be prefixed with the group id e.g `bpmn.enabled`
 */

/**
 * Metadata for a single setting.
 *
 * @typedef {Object} SettingsProperty
 *
 * @property {'text' | 'boolean' | 'select'} type - one of the supported types
 * @property {string} label - label on the settings page
 * @property {string|boolean} [default] - the default value
 * @property {Array<{label: string, value: string}>} [options] - options for select type
 * @property {string} [flag] - indicates that the setting can be overridden by a flag
 * @property {string} [description] - description on the settings page
 * @property {boolean} [restartRequired] - restart required to apply the setting
 * @property {string} [documentationUrl] - link to an external documentation
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
export class Settings {

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
     * @type { Object.<string, SettingsGroup> }
     */
    this._settings = {};

    /**
     * Dictionary of setting keys and their default values, if provided.
     *
     * @type { Object.<string, string|boolean> }
     */
    this._defaults = {};

    /**
     * Dictionary of all the settings keys and their values.
     * This is stored in the `settings.json` file.
     *
     * @type { Object.<string, string|boolean>}
     */
    this._values = {};

    /**
     * Dictionary of setting keys and their listeners.
     *
     * @type { Object.<string, Array<function>> }
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
   * Refere to {@link SettingsGroup} and {@link SettingsProperty} types for more details.
   *
   * @param { SettingsGroup } settings
  */
  register(settings) {
    const {
      id,
      title,
      properties
    } = settings;

    if (this._settings[id]) {

      forEach(properties, (property, key) => {

        if (this._settings[id].properties[key]) {
          console.error(`Setting with key ${key} is already registered`);
          return;
        }

        this._settings[id].properties[key] = property;
      });

    } else {
      this._settings[id] = { id, title, properties };
    }

    Object.entries(properties).forEach(([ key, { default: value } ]) => {
      this._defaults[key] = value;
    });
  }

  /**
   * Get value for the specified setting or all settings if no key is provided.
   *
   * @param { string|undefined } key
   * @returns { Object.<string, string|boolean>|string|boolean }
   */
  get(key) {
    return key ? (this._values[key] ?? this._defaults[key]) : { ...this._defaults, ...this._values };
  }

  /**
   * Get the metadata for the specified setting or all settings if no key is provided.
   *
   * @param { string|undefined } key
   * @returns { SettingsGroup }
   */
  getSchema(key) {
    const prefix = key ? key.split('.')[0] : null;
    return key ? this._settings[prefix].properties[key] : this._settings;
  }

  /**
   * Set the values for the specified settings.
   *
   * Calls the listeners for each setting that has changed. Saves the file.
   *
   * @param {Object.<string, string|boolean} settings - Dictionary of setting keys and their values.
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
   * Register a callback function that is called when the specified settings change.
   *
   * @param { string[]|string } settings - The setting key or an array of setting keys to listen to.
   * @param { (key:string, value: string|boolean) => any } callback - A function to call with the new value.
   */
  subscribe(settings, callback) {

    if (!isArray(settings)) {
      settings = [ settings ];
    }

    settings.forEach(setting => {
      this._listeners[setting] = [ ...(this._listeners[setting] ?? []), callback ];
    });
  }

  /**
   * Call all the listeners for the specified setting with the new value.
   *
   * @param {string} key
   */
  _notify(key) {
    forEach(this._listeners[key], listener => {
      listener({ [key]: this._values[key] });
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