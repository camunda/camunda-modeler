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
    this._camundaProjectItem = null;
    this._camundaProjectItems = [];
    this._activeTab = null;

    events.on('items-changed', (items) => {
      this._items = items;

      if (this.hasOpen()) {
        let camundaProjectItem = this.findItem(this._camundaProject.file.path);

        if (camundaProjectItem) {

          // a preferred marker may have been added next to the open one
          // (e.g. `camunda.json` beside `.process-application`); switch to it,
          // as item assignment follows the same preference
          camundaProjectItem = this.findCamundaProjectItemForItem(camundaProjectItem) || camundaProjectItem;
        } else {

          // project file may have been renamed (e.g. `.process-application`
          // renamed to `camunda.json`); re-associate via the active tab
          camundaProjectItem = this._findCamundaProjectItemForActiveTab();
        }

        // re-open to pick up changes of the project file and its resources;
        // close if the active tab is no project resource anymore
        if (camundaProjectItem && this._isActiveTabInCamundaProject(camundaProjectItem)) {
          this.open(camundaProjectItem);
        } else {
          this.close();
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
  open(camundaProjectItem) {
    const { file } = camundaProjectItem;

    const { contents } = file;

    let descriptor = {};

    try {
      descriptor = JSON.parse(contents && contents.length ? contents : '{}');
    } catch (err) {
      console.error(err);

      // emitting `error` without listener throws, the error is reported
      // through the project resources (`metadata.resources.error`) anyway
      if (this._events.listenerCount('error')) {
        this._events.emit('error', err);
      }
    }

    this._camundaProjectItem = camundaProjectItem;

    this._camundaProject = {
      ...descriptor,
      file
    };

    this._camundaProjectItems = this._items.filter(item => this.isCamundaProjectItem(item));

    this._events.emit('changed');
  }

  close() {
    if (!this.hasOpen()) {
      return;
    }

    this._camundaProject = null;
    this._camundaProjectItem = null;
    this._camundaProjectItems = [];

    this._events.emit('changed');
  }

  getOpen() {
    return this._camundaProject;
  }

  hasOpen() {
    return !!this._camundaProject;
  }

  /**
   * Get the indexed items that are resources of the open project.
   *
   * @returns {Item[]}
   */
  getItems() {
    return this._camundaProjectItems;
  }

  /**
   * Get the files of the open project, i.e. all resources deployed with it.
   * Files not indexed (e.g. Markdown prompts) come without metadata.
   *
   * @returns {Item[]}
   */
  getFiles() {
    if (!this.hasOpen()) {
      return [];
    }

    const resources = getResources(this._camundaProjectItem);

    if (!resources) {
      return this._camundaProjectItems;
    }

    return resources.selected.map(path => this.findItem(path) || createFileItem(path));
  }

  /**
   * Get the error that prevents the open project from being deployed, e.g.
   * an invalid `deployResources` configuration or an empty selection.
   *
   * @returns {string|null}
   */
  getError() {
    const resources = this._camundaProjectItem && getResources(this._camundaProjectItem);

    return (resources && resources.error) || null;
  }

  /**
   * Get the resources of the open project as deployment resource configs.
   *
   * @returns {Array<{ path: string, type: string }>}
   */
  getResourceConfigs() {
    if (!this.hasOpen()) {
      return [];
    }

    const resources = getResources(this._camundaProjectItem);

    // resources not resolved, fall back to indexed items
    if (!resources) {
      return this._camundaProjectItems
        .filter(item => DEPLOYABLE_TYPES.includes(item.metadata?.type))
        .map(item => ({ path: item.file.path, type: item.metadata.type }));
    }

    return resources.selected.flatMap(path => {
      const item = this.findItem(path);

      // without `deployResources`, do not deploy what the Modeler failed to
      // process, e.g. Camunda 7 BPMN; files not processed yet deploy by
      // extension; an explicit selection deploys as is
      if (resources.mode !== 'deployResources' && isNotDeployable(item)) {
        return [];
      }

      return [ {
        path,
        type: getResourceType(path, item)
      } ];
    });
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
   * Find project item for the active tab. The active tab is part of a project
   * if it is one of the project resources, or if the resources of the project
   * can not be resolved (e.g. invalid configuration), to report the error.
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

    const camundaProjectItem = this.findCamundaProjectItemForItem(item);

    if (camundaProjectItem && this._isActiveTabInCamundaProject(camundaProjectItem)) {
      return camundaProjectItem;
    }
  }

  /**
   * @param {Item} camundaProjectItem
   *
   * @returns {boolean}
   */
  _isActiveTabInCamundaProject(camundaProjectItem) {
    const path = this._activeTab && this._activeTab.file && this._activeTab.file.path;

    // a saved file is checked against the selection, even if not indexed (anymore)
    if (!path) {
      return true;
    }

    const resources = getResources(camundaProjectItem);

    return !resources || !!resources.error || isProjectResource(camundaProjectItem, path);
  }

  /**
   * Check if item is a resource of the open project. Excluded files are not,
   * even if they are located in the project directory.
   *
   * @param {Item} item
   *
   * @returns {boolean}
   */
  isCamundaProjectItem(item) {
    if (!getResources(this._camundaProjectItem)) {
      const camundaProjectItem = this.findCamundaProjectItemForItem(item);

      return !!camundaProjectItem && camundaProjectItem.file.path === this._camundaProject.file.path;
    }

    return isProjectResource(this._camundaProjectItem, item.file.path);
  }

  /**
   * Find the project item of the project an item is a resource of.
   *
   * @param {Item} item
   *
   * @returns {Item|undefined}
   */
  findCamundaProjectItemForResource(item) {
    const camundaProjectItem = this.findCamundaProjectItemForItem(item);

    if (camundaProjectItem && (!getResources(camundaProjectItem) || isProjectResource(camundaProjectItem, item.file.path))) {
      return camundaProjectItem;
    }
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

const DEPLOYABLE_TYPES = [ 'bpmn', 'dmn', 'form', 'rpa' ];

/**
 * Check whether an item was processed and found not deployable, e.g. a
 * Camunda 7 BPMN file or a broken file.
 *
 * @param {Item} [item]
 *
 * @returns {boolean}
 */
function isNotDeployable(item) {
  if (!item || item.metadata === undefined) {
    return false;
  }

  return !DEPLOYABLE_TYPES.includes(item.metadata?.type);
}

/**
 * @param {Item} camundaProjectItem
 *
 * @returns {{ selected: string[], error: string|null }|undefined}
 */
function getResources(camundaProjectItem) {
  return camundaProjectItem && camundaProjectItem.metadata && camundaProjectItem.metadata.resources;
}

/**
 * @param {Item} camundaProjectItem
 * @param {string} path
 *
 * @returns {boolean}
 */
function isProjectResource(camundaProjectItem, path) {
  const resources = getResources(camundaProjectItem);

  return !!resources && resources.selected.includes(path);
}

/**
 * @param {string} path
 * @param {Item} [item]
 *
 * @returns {string}
 */
function getResourceType(path, item) {
  const type = item && item.metadata && item.metadata.type;

  if (DEPLOYABLE_TYPES.includes(type)) {
    return type;
  }

  // dot-prefixed names (e.g. `.hidden.bpmn`) and upper case extensions
  // (e.g. `.BPMN`) are recognized, as when indexing
  const [ , extension = '' ] = /^.+\.([^.]+)$/.exec(path.split(/[\\/]/).pop()) || [];

  if (DEPLOYABLE_TYPES.includes(extension.toLowerCase())) {
    return extension.toLowerCase();
  }

  return 'resource';
}

/**
 * @param {string} path
 *
 * @returns {Item}
 */
function createFileItem(path) {
  const segments = path.split(/[\\/]/);

  const name = segments.pop();

  return {
    file: {
      name,
      path,
      dirname: path.slice(0, path.length - name.length - 1)
    },
    metadata: null
  };
}
