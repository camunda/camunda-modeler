/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { assign, reduce } from 'min-dash';

import pSeries from 'p-series';

import { EMPTY_TAB } from './App';

/**
 * Owns the tab lifecycle for <App>.
 *
 * Manages adding, updating, moving, closing and reopening tabs as well as the
 * derived dirty/unsaved/group state, while delegating rendering, saving and
 * navigation orchestration back to the host <App>.
 */
export default class TabManager {

  /**
   * @param {import('./App').App} app
   */
  constructor(app) {
    this._app = app;
  }

  /**
   * Set group for tab.
   *
   * @param {string} id ID of the tab
   * @param {string} group Group name
   */
  setTabGroup(id, group) {
    const app = this._app;

    const tab = app.state.tabs.find((tab) => tab.id === id);

    if (!tab) {
      return;
    }

    app.setState(({ tabGroups }) => {
      return {
        tabGroups: {
          ...tabGroups,
          [ id ]: group
        }
      };
    });
  }

  /**
   * Add a tab to the tab list.
   */
  addTab(tab, properties = {}) {
    const app = this._app;

    app.setState((state) => {
      const {
        tabs,
        activeTab
      } = state;

      if (tabs.indexOf(tab) !== -1) {
        throw new Error('tab exists');
      }

      const insertIdx = tabs.indexOf(activeTab) + 1;

      let unsavedState = {};

      if ('unsaved' in properties) {
        unsavedState = this.setUnsaved(tab, properties.unsaved);
      }

      this._onTabOpened(tab);

      return {
        ...unsavedState,
        tabs: [
          ...tabs.slice(0, insertIdx),
          tab,
          ...tabs.slice(insertIdx)
        ]
      };
    });

    return tab;
  }

  /**
   * Navigate shown tabs in given direction.
   */
  navigate(direction) {
    const app = this._app;

    const {
      activeTab,
      tabs
    } = app.state;

    // next tab in line as a fallback to history
    // navigation
    const nextFn = function() {
      return getNextTab(tabs, activeTab, direction);
    };

    const nextActiveTab = app.navigationHistory.navigate(direction, nextFn);

    return app.showTab(nextActiveTab);
  }

  /**
   * Check whether file has changed externally and update accordingly.
   *
   * @param {Tab} tab
   */
  checkFileChanged = async (tab) => {
    const app = this._app;

    const fileSystem = app.getGlobal('fileSystem');

    const {
      file
    } = tab;

    const tabLastModified = (file || {}).lastModified;

    // skip new file
    if (this.isUnsaved(tab) || typeof tabLastModified === 'undefined') {
      return tab;
    }

    const {
      lastModified
    } = await fileSystem.readFileStats(file);

    // skip unchanged
    if (!(lastModified > tabLastModified)) {
      return tab;
    }

    const { button } = await app.showDialog(getContentChangedDialog());

    if (button === 'ok') {
      const updatedFile = await fileSystem.readFile(file.path);

      return this.updateTab(tab, {
        file: updatedFile
      });
    } else {
      return this.updateTab(tab, {
        file: {
          ...file,
          lastModified
        }
      }, this.setUnsaved(tab, true));
    }
  };

  /**
   * Update the tab with new attributes.
   *
   * @param {Tab} tab
   * @param {Object} newAttrs
   * @param {Object} [newState={}]
   */
  updateTab(tab, newAttrs, newState = {}) {
    const app = this._app;

    if (newAttrs.id && newAttrs.id !== tab.id) {
      throw new Error('must not change tab.id');
    }

    const {
      tabsProvider
    } = app.props;

    let updatedTab = tabsProvider.createTabForFile(tab.file);
    updatedTab.id = tab.id;

    assign(updatedTab, newAttrs);

    app.setState((state) => {

      const {
        activeTab,
        tabs
      } = state;

      // replace in tabs
      const updatedTabs = tabs.map(t => {
        if (t === tab) {
          return updatedTab;
        }

        return t;
      });


      // replace activeTab
      let updatedActiveTab = activeTab;
      if (activeTab.id === updatedTab.id) {
        updatedActiveTab = updatedTab;
      }

      return {
        ...newState,
        activeTab: updatedActiveTab,
        tabs: updatedTabs
      };
    });

    // replace in navigation history
    app.navigationHistory.replace(tab, updatedTab);

    return updatedTab;
  }

  /**
   * Handle the saving dialog when closing a tab.
   *
   * @param {Tab} tab
   *
   * @return {Promise<boolean>} resolved to true if tab can be safely closed
   */
  saveBeforeClose = async (tab) => {
    const app = this._app;

    const { file } = tab;

    const { name } = file;

    try {

      // disable auto-save during <save-all> to prevent
      // interferring with user save decisions
      app.off('app.blurred', app.triggerAutoSave);

      if (this.isDirty(tab)) {
        const { button } = await app.showCloseFileDialog({ name });

        if (button === 'save') {
          const saved = await app.saveTab(tab);

          if (!saved) {
            return false;
          }
        } else if (button === 'cancel') {
          return false;
        }
      }
    } finally {

      // restore auto-save
      app.on('app.blurred', app.triggerAutoSave);
    }

    return true;
  };

  /**
   * Close tab.
   *
   * @param {Tab} tab
   *
   * @return {Promise<boolean>} resolved to true if tab is closed
   */
  closeTab = async (tab) => {
    const app = this._app;

    const canClose = await this.saveBeforeClose(tab);

    if (!canClose) {
      return false;
    }

    app.triggerAction('emit-event', {
      type: 'tab.closed',
      payload: {
        tab
      }
    });

    await this._removeTab(tab);

    this._onTabClosed(tab);

    return true;
  };

  hasUnsavedTabs = () => {
    const { tabs } = this._app.state;
    return tabs.some((tab) => {
      return this.isDirty(tab) || this.isUnsaved(tab);
    });
  };

  isEmptyTab = (tab) => {
    return tab === EMPTY_TAB;
  };

  isDirty = (tab) => {
    return !!this._app.state.dirtyTabs[tab.id];
  };

  isUnsaved = (tab) => {
    const { unsavedTabs } = this._app.state;
    const { id, file } = tab;

    return unsavedTabs[id] || (file && !file.path);
  };

  async _removeTab(tab) {
    const app = this._app;

    const {
      tabs,
      activeTab,
      openedTabs
    } = app.state;

    const {
      navigationHistory,
      closedTabs,
      recentTabs
    } = app;

    const {
      ...newOpenedTabs
    } = openedTabs;

    delete newOpenedTabs[tab.id];

    const {
      [ tab.id ]: _removedProfile,
      ...newEngineProfiles
    } = app.state.engineProfiles;

    const newTabs = tabs.filter(t => t !== tab);

    navigationHistory.purge(tab);

    if (!this.isUnsaved(tab)) {
      closedTabs.push(tab);
      recentTabs.push(tab);
    }

    if (activeTab === tab) {

      const tabIdx = tabs.indexOf(tab);

      // open previous tab, if it exists
      const nextActive = (
        navigationHistory.get() ||
        newTabs[tabIdx] ||
        newTabs[tabIdx - 1] ||
        EMPTY_TAB
      );

      await app.showTab(nextActive);
    }

    return new Promise((resolve) => {
      app.setState({
        tabs: newTabs,
        openedTabs: newOpenedTabs,
        engineProfiles: newEngineProfiles
      }, () => {
        app.props.cache.destroy(tab.id);
        resolve();
      });
    });
  }

  moveTab = (tab, newIndex) => {
    const app = this._app;

    const {
      tabs
    } = app.state;

    if (!tabs[ newIndex ]) {
      throw new Error('invalid index');
    }

    // remove tab at current index
    const newTabs = tabs.filter(t => t !== tab);

    // add tab at new index
    newTabs.splice(newIndex, 0, tab);

    app.setState({
      tabs: newTabs
    });
  };

  findOpenTab(file) {
    const {
      tabs
    } = this._app.state;

    return tabs.find(t => t.file && t.file.path === file.path);
  }

  setDirty(tab, dirty = true) {
    const { tabs } = this._app.state;

    const newDirtyTabs = reduce(tabs, (dirtyTabs, t) => {
      if (t === tab) {
        return dirtyTabs;
      }

      return {
        ...dirtyTabs,
        [ t.id ]: this.isDirty(t)
      };
    }, {
      [ tab.id ]: dirty
    });

    return {
      dirtyTabs: newDirtyTabs
    };
  }

  setUnsaved(tab, unsaved = true) {
    const { tabs } = this._app.state;

    const newUnsavedTabs = reduce(tabs, (unsavedTabs, t) => {
      if (t === tab) {
        return unsavedTabs;
      }

      return {
        ...unsavedTabs,
        [ t.id ]: this.isUnsaved(t)
      };
    }, {
      [ tab.id ]: unsaved
    });

    return {
      unsavedTabs: newUnsavedTabs
    };
  }

  tabSaved(tab, newFile) {
    const app = this._app;

    const {
      tabs
    } = app.state;

    tab.file = newFile;

    const dirtyState = this.setDirty(tab, false);
    const unsavedState = this.setUnsaved(tab, false);

    app.setState({
      tabs: [ ...tabs ],
      ...dirtyState,
      ...unsavedState
    });

    app.emit('tab.saved', { tab });
    app.triggerAction('lint-tab', { tab });

    this._onTabSaved(tab);

    return tab;
  }

  closeTabs = (matcher) => {
    const {
      tabs
    } = this._app.state;

    const allTabs = tabs.slice();

    const closeTasks = allTabs.filter(matcher).map((tab) => {
      return () => this.closeTab(tab);
    });

    return pSeries(closeTasks);
  };

  reopenLastTab = () => {
    const app = this._app;

    const lastTab = app.closedTabs.pop();

    if (lastTab) {
      this.addTab(lastTab);

      return app.showTab(lastTab);
    }

    return Promise.reject(new Error('no last tab'));
  };

  _onTabOpened(tab) {
    const app = this._app;

    if (!this.isUnsaved(tab)) {
      const {
        file,
        type
      } = tab;

      app.getGlobal('backend').send('file-context:file-opened', file.path, {
        processor: getProcessor(type)
      });
    }
  }

  _onTabClosed(tab) {
    const app = this._app;

    if (!this.isUnsaved(tab)) {
      const { file } = tab;

      app.getGlobal('backend').send('file-context:file-closed', file.path);
    }
  }

  _onTabSaved(tab) {
    const {
      file,
      type
    } = tab;

    this._app.getGlobal('backend').send('file-context:file-updated', file.path, {
      processor: getProcessor(type)
    });
  }
}


// helpers //////////

function getNextTab(tabs, activeTab, direction) {
  let nextIdx = tabs.indexOf(activeTab) + direction;

  if (nextIdx === -1) {
    nextIdx = tabs.length - 1;
  }

  if (nextIdx === tabs.length) {
    nextIdx = 0;
  }

  return tabs[nextIdx];
}

function getContentChangedDialog() {
  return {
    title: 'File changed',
    message: 'The file has been changed externally.\nWould you like to reload it?',
    type: 'question',
    buttons: [
      { id: 'ok', label: 'Reload' },
      { id: 'cancel', label: 'Cancel' }
    ]
  };
}

function getProcessor(type) {
  if (type === 'cloud-bpmn') {
    return 'bpmn';
  }

  if (type === 'cloud-dmn') {
    return 'dmn';
  }

  if (type === 'cloud-form') {
    return 'form';
  }

  return null;
}
