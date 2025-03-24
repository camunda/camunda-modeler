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
 * @typedef { (Object) } SettingsSchema ddd
 *
 * @typedef { (Object) } SettingsValues
 *
 * @typedef { Object} Setting
 * @property { string } id
 * @property { string } title
 * @property { Array[Object] } properties
 */

/**
 * Settings API
 *
 */
export class Settings {

  constructor(props) {

    const {
      config
    } = props;

    this._configProvider = config;

    /**
     * Dictionary with all the provided settings with their metadata.
     *
     * @example
     * {
     *   "testPlugin": {
     *     "title": "Test Client Plugin",
     *     "properties": {
     *       "testClientPlugin.welcomeMessage": {
     *         "type": "text",
     *         "default": "Hello World",
     *         "label": "Icon Color",
     *         "description": "Color of the lovely heart icon in the Status Bar."
     *       },
     *       "testClientPlugin.heartbeat": {
     *         "type": "boolean",
     *         "default": true,
     *         "label": "Heartbeat",
     *         "description": "Will My Heart Go On?"
     *       }
     *     }
     *   },
     *   "bpmnEditor": {
     *     "title": "BPMN Editor",
     *     "properties": {
     *       "bpmnEditor.forceLinting": {
     *         "type": "boolean",
     *         "default": false,
     *         "label": "Force Linting",
     *         "description": "Force linting even when the Problem panel is closed."
     *       }
     *     }
     *   }
     * }
     */
    this._settings = {};

    /**
     * Dictionary of all the settings.
     * This is stored in the `settings.json` file.
     *
     * @type { Object.<string, string|boolean>}
     *
     * @example
     * {
     *   "bpmnEditor.linting": true,
     *   "testPlugin.welcomeMessage": "Hello World"
     * }
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
   * some fucntion
   * @param { Setting } settings
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

      this._settings[id] = { title, properties };

    }


    Object.entries(properties).forEach(([ key, { default: value } ]) => {
      if (!this._values[key]) {
        this._values[key] = value;
      }
    });
  }

  /**
   * Get value for the specified setting or all settings if no key is provided.
   * @param { string|undefined } key
   * @returns { Object.<string, string|boolean>|string|boolean }
   */
  get(key) {
    return key ? this._values[key] : { ...this._values };
  }

  /**
   * Get the metadata for the specified setting or all settings if no key is provided.
   * @param { string|undefined } key
   * @returns { SettingsSchema }
   */
  getSchema(key) {
    const prefix = key ? key.split('.')[0] : null;
    return key ? this._settings[prefix].properties[key] : this._settings;
  }

  /**
   * Set the thing ???
   * @param {} settings
   */
  set(settings) {
    this._values = { ...this._values, ...settings };

    this._save();

    forEach(settings, (_, key) => {
      this._notify(key);
    });
  }

  /**
   * Register a callback function that is called when the specified settings change.
   *
   * @param { string[]|string } settings
   * @param { function } callback
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
      listener(this._values[key]);
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
   */
  async _load() {
    const jsonValues = await this._configProvider.get('settings');
    this._values = jsonValues;

    this._notifyAll();
  }

  /**
   * Save settings to the `settings.json` file.
   */
  _save() {
    this._configProvider.set('settings', this._values);
  }
}