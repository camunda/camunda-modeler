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
   * Load the saved files of the recently closed tabs from the config, newest
   * first.
   *
   * @param {Object} config
   *
   * @return {Promise<Array<{ name: string, path: string }>>}
   */
  static async loadRecentFiles(config) {
    const elements = await config.get(CONFIG_KEY_RECENT_TABS) || [];

    return RecentTabs.getRecentFiles(elements);
  }

  /**
   * Get the saved files of the given recently closed tabs, newest first.
   *
   * @param {Array<{ file: Object }>} tabs
   *
   * @return {Array<{ name: string, path: string }>}
   */
  static getRecentFiles(tabs) {
    return tabs
      .map(tab => tab?.file)
      .filter(file => file?.path)
      .reverse()
      .map(({ name, path }) => ({ name, path }));
  }

  constructor(options = {}) {
    const {
      config,
      fileSystem,
      setState
    } = options;

    this._setState = setState;
    this._config = config;
    this._fileSystem = fileSystem;
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
      this.elements = await withoutRemovedFiles(elements, this._fileSystem);
    }
  }

  /**
   * Remove the tabs of files that were removed from disk.
   */
  async removeMissing() {
    const elements = this.elements;

    const existing = await withoutRemovedFiles(elements, this._fileSystem);

    // skip if nothing was removed or the tabs changed in the meantime
    if (existing.length === elements.length || elements !== this.elements) {
      return;
    }

    this.elements = existing;
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


// helpers //////////

/**
 * @param {Array<{ file: Object }>} tabs
 * @param {Object} fileSystem
 *
 * @return {Promise<Array<{ file: Object }>>}
 */
async function withoutRemovedFiles(tabs, fileSystem) {
  const stats = await Promise.all(tabs.map(({ file }) => fileSystem.readFileStats(file)));

  // a removed file has no modification time
  return tabs.filter((_, index) => stats[ index ]?.lastModified !== 0);
}