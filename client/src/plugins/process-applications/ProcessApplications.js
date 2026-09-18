/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import EventEmitter from 'events';

export default class ProcessApplications {
  constructor() {
    const events = this._events = new EventEmitter();

    this._items = [];
    this._processApplication = null;
    this._processApplicationItems = [];
    this._activeTab = null;

    events.on('items-changed', (items) => {
      this._items = items;

      if (this.hasOpen()) {
        const processApplicationItem = this.findItem(this._processApplication.file.path);

        if (processApplicationItem) {
          this._processApplicationItems = this._items.filter(item => this.isProcessApplicationItem(item));

          events.emit('changed');
        } else {
          this.close();
        }
      } else if (this._activeTab) {
        const { file } = this._activeTab;

        if (!file || !file.path) {
          return;
        }

        const item = this._items.find(item => item.file.path === file.path);

        if (!item) {
          return;
        }

        const processApplicationItem = this.findProcessApplicationItemForItem(item);

        if (processApplicationItem) {
          this.open(processApplicationItem);
        }
      }
    });

    events.on('activeTab-changed', (activeTab) => {
      this._activeTab = activeTab;

      const { file } = activeTab;

      if (!file || !file.path) {
        this.close();

        return;
      }

      const item = this._items.find(item => item.file.path === file.path);

      if (!item) {
        this.close();

        return;
      }

      const processApplicationItem = this.findProcessApplicationItemForItem(item);

      if (processApplicationItem) {
        this.open(processApplicationItem);
      } else {
        this.close();
      }
    });
  }

  /**
   * @param {Item}
   */
  async open(processApplicationItem) {
    try {
      const { file } = processApplicationItem;

      const { contents } = file;

      this._processApplication = {
        file,
        ...JSON.parse(contents.length ? contents : '{}')
      };

      this._processApplicationItems = this._items.filter(item => this.isProcessApplicationItem(item));

      this._events.emit('changed');
    } catch (err) {
      console.error(err);

      this._events.emit('error', err);

      this._processApplication = null;
      this._processApplicationItems = [];
    }
  }

  close() {
    if (!this.hasOpen()) {
      return;
    }

    this._processApplication = null;
    this._processApplicationItems = [];

    this._events.emit('changed');
  }

  getOpen() {
    return this._processApplication;
  }

  hasOpen() {
    return !!this._processApplication;
  }

  getItems() {
    return this._processApplicationItems;
  }

  emit(...args) {
    this._events.emit(...args);
  }

  on(...args) {
    this._events.on(...args);
  }

  off(...args) {
    this._events.off(...args);
  }

  /**
   * Check if item is process application item.
   *
   * @param {Item} item
   *
   * @returns {boolean}
   */
  isProcessApplicationItem(item) {
    const processApplicationItem = this.findProcessApplicationItemForItem(item);

    return processApplicationItem && processApplicationItem.file.path === this._processApplication.file.path;
  }

  /**
   * Find process application item for item.
   *
   * @param {Item} item
   *
   * @returns {Item|undefined}
   */
  findProcessApplicationItemForItem(item) {
    return this._items.find(otherItem => {
      return otherItem.metadata?.type === 'processApplication' && item.file.path.startsWith(otherItem.file.dirname);
    });
  }

  /**
   * Find item by path.
   *
   * @param {string} path
   *
   * @returns {Item|undefined}
   */
  findItem(path) {
    return this._items.find(item => item.file.path === path);
  }
}
