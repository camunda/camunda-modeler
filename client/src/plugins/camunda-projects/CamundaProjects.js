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

          // a preferred marker may have been added next to the open one
          // (e.g. `camunda.json` beside `.process-application`); switch to it,
          // as item assignment follows the same preference
          const preferredCamundaProjectItem = this.findCamundaProjectItemForItem(camundaProjectItem);

          if (preferredCamundaProjectItem && preferredCamundaProjectItem.file.path !== camundaProjectItem.file.path) {
            this.open(preferredCamundaProjectItem);

            return;
          }

          this._camundaProjectItems = this._items.filter(item => this.isCamundaProjectItem(item));

          events.emit('changed');
        } else {

          // project file may have been renamed (e.g. `.process-application`
          // renamed to `camunda.json`); re-associate via the active tab
          const newCamundaProjectItem = this._findCamundaProjectItemForActiveTab();

          if (newCamundaProjectItem) {
            this.open(newCamundaProjectItem);
          } else {
            this.close();
          }
        }
      } else if (this._activeTab) {
        const camundaProjectItem = this._findCamundaProjectItemForActiveTab();

        if (camundaProjectItem) {
          this.open(camundaProjectItem);
        }
      }
    });

    events.on('activeTab-changed', (activeTab) => {
      this._activeTab = activeTab;

      const camundaProjectItem = this._findCamundaProjectItemForActiveTab();

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
   * Find project item for the active tab.
   *
   * @returns {Item|undefined}
   */
  _findCamundaProjectItemForActiveTab() {
    if (!this._activeTab) {
      return;
    }

    const { file } = this._activeTab;

    if (!file || !file.path) {
      return;
    }

    const item = this._items.find(item => item.file.path === file.path);

    if (!item) {
      return;
    }

    return this.findCamundaProjectItemForItem(item);
  }

  /**
  * Check if item is part of the open project.
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
  * Find project item for item.
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
      .sort((a, b) => {

        // nearest directory wins; on a tie (legacy and new marker in the same
        // directory) prefer `camunda.json`, matching the backend
        const byDirname = b.file.dirname.length - a.file.dirname.length;

        if (byDirname !== 0) {
          return byDirname;
        }

        return (b.file.name === 'camunda.json') - (a.file.name === 'camunda.json');
      })[0];
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
