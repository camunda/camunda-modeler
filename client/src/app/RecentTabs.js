/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

export class RecentTabs {
  constructor(options = {}) {
    const {
      config,
      setState
    } = options;

    this._setState = setState;
    this._config = config;
    this._configKey = 'recentTabs';
    this._maxLength = 10;
    this._elements = [];

    this._load();
  }

  set elements(_elements) {
    this._elements = _elements;
    this._config.set(this._configKey, _elements);
    this._setState(_elements);
  }

  get elements() {
    return this._elements;
  }

  async _load() {
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