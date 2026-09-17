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

export default class CamundaProjects {
  constructor() {
    const events = this._events = new EventEmitter();

    this._items = [];
    this._camundaProject = null;
    this._camundaProjectItems = [];
    this._activeTab = null;

    events.on('items-changed', (items) => {
      this._items = items;

      if (this.hasOpen()) {
        const camundaProjectItem = this.findItem(this._camundaProject.file.path);

        if (camundaProjectItem) {
          this._camundaProjectItems = this._items.filter(item => this.isCamundaProjectItem(item));

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

        const camundaProjectItem = this.findCamundaProjectItemForItem(item);

        if (camundaProjectItem) {
          this.open(camundaProjectItem);
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

      const camundaProjectItem = this.findCamundaProjectItemForItem(item);

      if (camundaProjectItem) {
        this.open(camundaProjectItem);
      } else {
        this.close();
      }
    });
  }

  /**
   * @param {Item} camundaProjectItem
   */
  async open(camundaProjectItem) {
    try {
      const { file } = camundaProjectItem;

      const { contents } = file;

      this._camundaProject = {
        file,
        ...JSON.parse(contents.length ? contents : '{}')
      };

      this._camundaProjectItems = this._items.filter(item => this.isCamundaProjectItem(item));

      this._events.emit('changed');
    } catch (err) {
      console.error(err);

      this._events.emit('error', err);

      this._camundaProject = null;
      this._camundaProjectItems = [];
    }
  }

  close() {
    if (!this.hasOpen()) {
      return;
    }

    this._camundaProject = null;
    this._camundaProjectItems = [];

    this._events.emit('changed');
  }

  getOpen() {
    return this._camundaProject;
  }

  hasOpen() {
    return !!this._camundaProject;
  }

  getItems() {
    return this._camundaProjectItems;
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
  * Check if item is part of the open Camunda project.
   *
   * @param {Item} item
   *
   * @returns {boolean}
   */
  isCamundaProjectItem(item) {
    const camundaProjectItem = this.findCamundaProjectItemForItem(item);

    return camundaProjectItem && camundaProjectItem.file.path === this._camundaProject.file.path;
  }

  /**
  * Find Camunda project item for item.
   *
   * @param {Item} item
   *
   * @returns {Item|undefined}
   */
  findCamundaProjectItemForItem(item) {
    return this._items
      .filter(otherItem => {
        const { dirname } = otherItem.file;
        const isInProject = item.file.path.startsWith(`${ dirname }/`) || item.file.path.startsWith(`${ dirname }\\`);

        return otherItem.metadata?.type === 'camundaProject' && isInProject;
      })
      .sort((a, b) => b.file.dirname.length - a.file.dirname.length)[0];
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
