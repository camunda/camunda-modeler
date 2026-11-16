/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const CONFIG_KEY_RECENT_TABS = 'recentTabs';

export class RecentTabs {

  /**
   * Get the saved files of the recently closed tabs, newest first.
   *
   * @param {Object} config
   *
   * @return {Promise<Array<{ name: string, path: string }>>}
   */
  static async getRecentFiles(config) {
    const elements = await config.get(CONFIG_KEY_RECENT_TABS) || [];

    return elements
      .map(element => element?.file)
      .filter(file => file?.path)
      .reverse()
      .map(({ name, path }) => ({ name, path }));
  }

  constructor(options = {}) {
    const {
      config,
      setState
    } = options;

    this._setState = setState;
    this._config = config;
    this._configKey = CONFIG_KEY_RECENT_TABS;
    this._maxLength = 10;
    this._elements = [];
  }

  set elements(_elements) {
    this._elements = _elements;
    this._config.set(this._configKey, _elements);
    this._setState(_elements);
  }

  get elements() {
    return this._elements;
  }

  async load() {
    const elements = await this._config.get(this._configKey);

    if (elements) {
      this.elements = elements;
    }
  }

  push(element) {
    this.elements = [
      ...this.elements
        .filter(e => (e.file.path !== element.file.path))
        .slice(-(this._maxLength - 1)),
      element
    ];
  }
}