/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { PureComponent } from 'react';

import debug from 'debug';

import {
  assign,
  debounce,
  forEach,
  groupBy,
  isString,
  map,
  merge,
  reduce
} from 'min-dash';

import EventEmitter from 'events';

import defaultPlugins from '../plugins';

import executeOnce from './util/executeOnce';

import { WithCache } from './cached';

import { DropZone } from './drop-zone';

import {
  SlotFillRoot
} from './slot-fill';

import PanelContainer from './resizable-container/PanelContainer';

import Panel from './panel/Panel';

import LintingTab from './panel/tabs/linting/LintingTab';
import LogTab from './panel/tabs/log/LogTab';

import { StatusBar } from './status-bar';

import { KeyboardInteractionTrapContext } from '../shared/ui/trap/KeyboardInteractionTrap';

import {
  KeyboardShortcutsModal
} from './modals';

import {
  TabLinks,
  TabContainer,
  Tab,
  Loader
} from './primitives';

import pDefer from 'p-defer';
import pSeries from 'p-series';

import History from './History';

import { PluginsRoot } from './plugins';

import * as css from './App.less';

import Notifications, { NOTIFICATION_TYPES } from './notifications';
import { RecentTabs } from './RecentTabs';

const log = debug('App');

export const EMPTY_TAB = {
  id: '__empty',
  type: 'empty'
};

const ENCODING_UTF8 = 'utf8';

const FILTER_ALL_EXTENSIONS = {
  name: 'All Files',
  extensions: [ '*' ]
};

const INITIAL_STATE = {
  activeTab: EMPTY_TAB,
  dirtyTabs: {},
  unsavedTabs: {},
  recentTabs: [],
  layout: {},
  tabs: [],
  tabGroups: {},
  tabState: {},
  lintingState: {},
  logEntries: [],
  notifications: [],
  currentModal: null
};


export class App extends PureComponent {

  constructor(props) {
    super(props);

    this.state = {
      ...INITIAL_STATE,
      tabShown: pDefer()
    };

    this.tabComponentCache = {};

    // TODO(nikku): make state
    this.navigationHistory = new History();

    this.events = new EventEmitter();

    // TODO(nikku): make state
    this.closedTabs = new History();
    this.recentTabs = new RecentTabs({
      setState: value => this.setState({ recentTabs: value }),
      config: this.getGlobal('config')
    });

    this.tabRef = React.createRef();

    const userPlugins = this.getPlugins('client');

    this.plugins = [
      ...defaultPlugins,
      ...userPlugins
    ];

    // remember the original App#checkFileChanged version
    // for testing purposes
    this.__checkFileChanged = this.checkFileChanged;

    // ensure we do not accidently execute the method recursively
    // cf. https://github.com/camunda/camunda-modeler/issues/1118
    this.checkFileChanged = executeOnce(
      (tab) => this.__checkFileChanged(tab),
      (tab) => tab.id
    );

    if (process.env.NODE_ENV !== 'test') {
      this.workspaceChangedDebounced = debounce(this.workspaceChangedDebounced, 1500);
      this.updateMenu = debounce(this.updateMenu, 50);
      this.resizeTab = debounce(this.resizeTab, 50);
    }

    this.currentNotificationId = 0;
  }

  /**
   * Set group for tab.
   *
   * @param {string} id ID of the tab
   * @param {string} group Group name
   */
  setTabGroup(id, group) {
    const tab = this.state.tabs.find((tab) => tab.id === id);

    if (!tab) {
      throw new Error(`Tab with ID ${id} not found`);
    }

    this.setState(({ tabGroups }) => {
      return {
        tabGroups: {
          ...tabGroups,
          [ id ]: group
        }
      };
    });
  }

  createDiagram = async (type = 'bpmn') => {

    const {
      tabsProvider
    } = this.props;

    const tab = this.addTab(
      tabsProvider.createTab(type)
    );

    await this.showTab(tab);

    return tab;
  };

  /**
   * Add a tab to the tab list.
   */
  addTab(tab, properties = {}) {

    this.setState((state) => {
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

    const {
      activeTab,
      tabs
    } = this.state;

    // next tab in line as a fallback to history
    // navigation
    const nextFn = function() {
      return getNextTab(tabs, activeTab, direction);
    };

    const nextActiveTab = this.navigationHistory.navigate(direction, nextFn);

    return this.showTab(nextActiveTab);
  }

  /**
   * Check whether file has changed externally and update accordingly.
   *
   * @param {Tab} tab
   */
  checkFileChanged = async (tab) => {

    const fileSystem = this.getGlobal('fileSystem');

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

    const { button } = await this.showDialog(getContentChangedDialog());

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

    if (newAttrs.id && newAttrs.id !== tab.id) {
      throw new Error('must not change tab.id');
    }

    const {
      tabsProvider
    } = this.props;

    let updatedTab = tabsProvider.createTabForFile(tab.file);
    updatedTab.id = tab.id;

    assign(updatedTab, newAttrs);

    this.setState((state) => {

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
    this.navigationHistory.replace(tab, updatedTab);

    return updatedTab;
  }


  /**
   * Show the tab.
   *
   * @param {Tab} tab
   *
   * @return {Promise<Void>} tab shown promise
   */
  showTab(tab) {

    const {
      activeTab,
      tabShown
    } = this.state;

    if (activeTab === tab) {
      return tabShown.promise;
    }

    if (!this.isEmptyTab(tab)) {
      const navigationHistory = this.navigationHistory;

      if (navigationHistory.get() !== tab) {
        navigationHistory.push(tab);
      }
    }

    const deferred = pDefer();


    this.setState({
      activeTab: tab,
      Tab: this.getTabComponent(tab),
      tabShown: deferred,
      tabState: {},
      tabLoadingState: 'loading'
    });

    return deferred.promise;
  }

  /**
   * Handle the saving dialog when closing a tab.
   *
   * @param {Tab} tab
   *
   * @return {Promise<boolean>} resolved to true if tab can be safely closed
   */
  saveBeforeClose = async (tab) => {
    const { file } = tab;

    const { name } = file;

    if (this.isDirty(tab)) {
      const { button } = await this.showCloseFileDialog({ name });

      if (button === 'save') {
        const saved = await this.saveTab(tab);

        if (!saved) {
          return false;
        }
      } else if (button === 'cancel') {
        return false;
      }
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
    const canClose = await this.saveBeforeClose(tab);

    if (!canClose) {
      return false;
    }

    this.triggerAction('emit-event', {
      type: 'tab.closed',
      payload: {
        tab
      }
    });

    await this._removeTab(tab);

    this._onTabClosed(tab);

    return true;
  };

  /**
   * Reload modeler.
   *
   * @param {boolean} restart if true, performs a hard app restart instead of a reload
   *
   * @return {Promise<boolean>} resolved to true if modeler is reloaded
   */
  reloadModeler = async (restart) => {
    const dialog = this.getGlobal('dialog');
    const hasUnsavedTabs = this.hasUnsavedTabs();

    const reloadFn = restart === true ? this.restart : this.reload;

    if (!hasUnsavedTabs) {
      reloadFn();
      return;
    }

    const { button } = await dialog.showReloadDialog(hasUnsavedTabs);

    if (button === 'save') {
      await this.saveAllTabs();
      reloadFn();

    } else if (button === 'reload') {
      reloadFn();
      return true;
    } else {
      return false;
    }
  };

  hasUnsavedTabs = () => {
    const { tabs } = this.state;
    return tabs.some((tab) => {
      return this.isDirty(tab) || this.isUnsaved(tab);
    });
  };

  reload = async (options) => {
    this.getGlobal('backend').send('app:reload', options);
  };

  restart = async () => {
    this.getGlobal('backend').send('app:restart');
  };

  isEmptyTab = (tab) => {
    return tab === EMPTY_TAB;
  };

  isDirty = (tab) => {
    return !!this.state.dirtyTabs[tab.id];
  };

  isUnsaved = (tab) => {
    const { unsavedTabs } = this.state;
    const { id, file } = tab;

    return unsavedTabs[id] || (file && !file.path);
  };

  async _removeTab(tab) {

    const {
      tabs,
      activeTab,
      openedTabs
    } = this.state;

    const {
      navigationHistory,
      closedTabs,
      recentTabs
    } = this;

    const {
      ...newOpenedTabs
    } = openedTabs;

    delete newOpenedTabs[tab.id];

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

      await this.showTab(nextActive);
    }

    this.setState({
      tabs: newTabs,
      openedTabs: newOpenedTabs
    }, () => {
      this.props.cache.destroy(tab.id);
    });
  }

  selectTab = async tab => {
    const updatedTab = await this.checkFileChanged(tab);
    return this.showTab(updatedTab || tab);
  };

  moveTab = (tab, newIndex) => {
    const {
      tabs
    } = this.state;

    if (!tabs[ newIndex ]) {
      throw new Error('invalid index');
    }

    // remove tab at current index
    const newTabs = tabs.filter(t => t !== tab);

    // add tab at new index
    newTabs.splice(newIndex, 0, tab);

    this.setState({
      tabs: newTabs
    });
  };

  showOpenFilesDialog = async () => {
    const dialog = this.getGlobal('dialog');

    const {
      tabsProvider
    } = this.props;

    const {
      activeTab
    } = this.state;

    const providers = tabsProvider.getProviders();

    const filters = getOpenFilesDialogFilters(providers);

    const filePaths = await dialog.showOpenFilesDialog({
      activeFile: activeTab.file,
      filters
    });

    if (!filePaths.length) {
      return;
    }

    const files = await this.readFileList(filePaths);

    await this.openFiles(files);
  };

  showCloseFileDialog = (file) => {
    const { name } = file;

    return this.getGlobal('dialog').showCloseFileDialog({ name });
  };

  showSaveFileDialog = (file, options = {}) => {
    const {
      filters,
      title
    } = options;

    return this.getGlobal('dialog').showSaveFileDialog({
      file,
      filters,
      title
    });
  };

  showSaveFileErrorDialog(options) {
    return this.getGlobal('dialog').showSaveFileErrorDialog(options);
  }

  openEmptyFile = async (file) => {
    const {
      tabsProvider
    } = this.props;

    const dialog = this.getGlobal('dialog');

    const { name } = file;

    const fileType = getFileTypeFromExtension(name);

    if (!tabsProvider.hasProvider(fileType)) {
      const providerNames = tabsProvider.getProviderNames();

      await dialog.showOpenFileErrorDialog(getOpenFileErrorDialog({
        name,
        providerNames
      }));

      return;
    }

    const { button } = await dialog.showEmptyFileDialog({
      file,
      type: fileType
    });

    if (button == 'create') {

      let tab = this.addTab(
        tabsProvider.createTabForFile(file),
        { unsaved: true }
      );

      await this.selectTab(tab);

      return tab;
    }
  };

  /**
   * Open the given files, optionally passing a file
   * that should be active after the operation.
   *
   * File activation may be disabled by explicitly passing
   * `false` as the activeFile. Otherwise it will either activate
   * the tab corresponding to the activeFile or the last opened tab.
   *
   * @param {Array<File>} files
   * @param {File|boolean} activateFile
   *
   * @return {Array<Tab>} all tabs that could be opened from the given files.
   */
  openFiles = async (files, activateFile) => {

    const {
      tabsProvider
    } = this.props;

    if (!files.length) {
      return [];
    }

    // trim whitespace
    files = files.map(file => {
      const { contents } = file;

      return {
        ...file,
        contents: contents.replace(/(^\s*|\s*$)/g, '')
      };
    });

    // either find existing or create new tab for every given file
    const openedTabs = await this.findOrCreateTabs(files, tabsProvider);

    // unless activation is disabled via activateFile=false,
    // open the tab for the desired file or, if not found,
    // the last opened tab
    if (activateFile !== false) {
      const activeTab = activateFile && this.findOpenTab(activateFile) || openedTabs[openedTabs.length - 1];

      if (activeTab) {
        await this.selectTab(activeTab);
      }
    }

    return openedTabs;
  };

  readFileList = async filePaths => {
    const readOperations = filePaths.map(this.readFileFromPath);

    const rawFiles = await Promise.all(readOperations);

    const files = rawFiles.filter(Boolean);

    return files;
  };

  readFileFromPath = async (filePath) => {

    const fileSystem = this.getGlobal('fileSystem');

    const {
      tabsProvider
    } = this.props;

    const fileType = getFileTypeFromExtension(filePath);

    const provider = tabsProvider.getProvider(fileType);

    const encoding = provider.encoding ? provider.encoding : ENCODING_UTF8;

    let file = null;

    try {
      file = await fileSystem.readFile(filePath, {
        encoding
      });
    } catch (error) {
      if (error.code === 'EISDIR') {
        return this.handleError(new Error(`Cannot open directory: ${filePath}`));
      }

      this.handleError(error);
    }

    return file;
  };

  /**
   * Find existing tabs for given files. If no tab was found for one tab,
   * create a new one.
   * @param {Array<File>} files
   * @param {TabsProvider} tabsProvider
   *
   * @returns {Array<Tab>}
   */
  async findOrCreateTabs(files, tabsProvider) {
    const dialog = this.getGlobal('dialog');

    const openTasks = files.slice().reverse().map((file) => {
      const { name } = file;

      return async () => {
        let tab;

        if (!file.contents.length) {
          tab = await this.openEmptyFile(file);
        } else {
          tab = this.findOpenTab(file);
          if (!tab) {
            const newTab = tabsProvider.createTabForFile(file);
            if (newTab) {
              tab = this.addTab(newTab);
            } else {
              const providerNames = tabsProvider.getProviderNames();

              await dialog.showOpenFileErrorDialog(getOpenFileErrorDialog({
                name,
                providerNames
              }));
            }
          }
        }

        return tab;
      };
    });

    const openResults = await pSeries(openTasks);

    // filter out empty elements
    const openedTabs = openResults.filter(openedTab => openedTab);

    return openedTabs.slice().reverse();
  }

  findOpenTab(file) {

    const {
      tabs
    } = this.state;

    return tabs.find(t => t.file && t.file.path === file.path);
  }

  emit(event, ...args) {
    this.events.emit(event, ...args);
  }

  on(event, listener) {
    this.events.on(event, listener);
  }

  off(event, listener) {
    this.events.off(event, listener);
  }

  emitWithTab(type, tab, payload) {

    this.emit(type, {
      ...payload,
      tab
    });
  }

  openTabLinksMenu = (tab, event) => {
    event.preventDefault();

    this.props.onContextMenu('tab', { tabId: tab.id });
  };

  openTabMenu = (event, type, context) => {
    event.preventDefault();

    this.props.onContextMenu(type);
  };

  handleLayoutChanged = (newLayout) => {
    const {
      layout
    } = this.state;

    const latestLayout = merge({}, layout, newLayout);

    this.setLayout(latestLayout);
  };


  /**
   * Mark a tab as shown.
   *
   * @param {Object} tab descriptor
   *
   * @return {Function} tab shown callback
   */
  handleTabShown = (tab) => () => {

    const {
      openedTabs,
      activeTab,
      tabShown
    } = this.state;

    if (tab === activeTab) {
      tabShown.resolve();
    } else {
      tabShown.reject(new Error('tab miss-match'));
    }

    this.setState({
      openedTabs: {
        ...openedTabs,
        [activeTab.id]: true
      },
      tabLoadingState: 'shown'
    });
  };

  /**
   * Handle tab error.
   *
   * @param {Object} tab descriptor
   *
   * @return {Function} tab error callback
   */
  handleTabError = (tab) => (error) => {
    this.handleError(error, tab);
  };

  /**
   * Handle tab warning.
   *
   * @param {Object} tab descriptor
   *
   * @return {Function} tab warning callback
   */
  handleTabWarning = (tab) => (warning) => {
    this.handleWarning(warning, tab);
  };

  /**
   * Handle tab changed.
   *
   * @param {Object} tab descriptor
   *
   * @return {Function} tab changed callback
   */
  handleTabChanged = (tab) => (properties = {}) => {

    let {
      tabState
    } = this.state;

    let dirtyState = {};

    if ('dirty' in properties) {
      dirtyState = this.setDirty(tab, properties.dirty);
    }

    this.setState({
      ...dirtyState,
      tabState: {
        ...tabState,
        ...properties
      }
    });
  };

  lintTab = async (tab, contents) => {
    const { tabsProvider } = this.props;

    const { type } = tab;

    const tabProvider = tabsProvider.getProvider(type);

    const plugins = this.getPlugins(`lintRules.${ type }`);

    const linter = await tabProvider.getLinter(plugins, tab, this.getConfig);

    if (!linter) {
      return;
    }

    if (!contents) {
      contents = tab.file.contents;
    }

    const results = await linter.lint(contents);

    this.setLintingState(tab, results);
  };

  getLintingState = (tab) => {
    return this.state.lintingState[ tab.id ] || [];
  };

  setLintingState = (tab, results) => {
    const { tabs } = this.state;

    const lintingState = reduce(tabs, (lintingState, t) => {
      if (t === tab) {
        return lintingState;
      }

      return {
        ...lintingState,
        [ t.id ]: this.getLintingState(t)
      };
    }, {
      [ tab.id ]: results
    });

    this.setState({
      lintingState
    });
  };

  resizeTab = () => {
    const tab = this.tabRef.current;

    return tab.triggerAction('resize');
  };

  setDirty(tab, dirty = true) {
    const { tabs } = this.state;

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
    const { tabs } = this.state;

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

    const {
      tabs
    } = this.state;

    tab.file = newFile;

    const dirtyState = this.setDirty(tab, false);
    const unsavedState = this.setUnsaved(tab, false);

    this.setState({
      tabs: [ ...tabs ],
      ...dirtyState,
      ...unsavedState
    });

    this.emit('tab.saved', { tab });
    this.triggerAction('lint-tab', { tab });

    this._onTabSaved(tab);

    return tab;
  }

  getTabComponent(tab) {

    const type = tab.type;

    if (this.tabComponentCache[type]) {
      return this.tabComponentCache[type];
    }

    const {
      tabsProvider
    } = this.props;

    var tabComponent = tabsProvider.getTabComponent(type) || missingProvider(type);

    Promise.resolve(tabComponent).then((c) => {

      var Tab = c.default || c;

      this.tabComponentCache[type] = Tab;

      if (this.state.activeTab === tab) {
        this.setState({
          Tab
        });
      }
    });

    return (this.tabComponentCache[type] = LoadingTab);
  }

  componentDidMount() {
    const {
      onReady
    } = this.props;

    if (typeof onReady === 'function') {
      onReady();
    }

    this.on('app.activeTabChanged', () => {
      this.closeNotifications();
    });

    this.on('tab.activeSheetChanged', () => {
      this.closeNotifications();
    });
  }

  componentDidUpdate(prevProps, prevState) {

    const {
      activeTab,
      tabs,
      recentTabs,
      tabLoadingState,
      tabState,
      layout
    } = this.state;

    const {
      onTabChanged,
      onTabShown
    } = this.props;

    if (prevState.activeTab !== activeTab) {
      if (typeof onTabChanged === 'function') {
        onTabChanged(activeTab, prevState.activeTab);
      }

      this.emit('app.activeTabChanged', {
        activeTab
      });
    }

    if (tabLoadingState === 'shown' && prevState.tabLoadingState !== 'shown') {
      if (typeof onTabShown === 'function') {
        onTabShown(activeTab);
      }
    }

    if (tabs !== prevState.tabs) {
      this.emit('app.tabsChanged', {
        tabs
      });
    }

    if (
      activeTab !== prevState.activeTab ||
      tabs !== prevState.tabs ||
      layout !== prevState.layout
    ) {
      this.workspaceChanged();
    }


    if (
      tabState !== prevState.tabState ||
      recentTabs !== prevState.recentTabs
    ) {
      this.updateMenu(tabState);
    }

    if (layout !== prevState.layout) {
      this.triggerAction('resize');
    }
  }

  componentDidCatch(error, info) {
    this.handleError(error);
  }

  /**
   * Save workspace debounced.
   *
   * @returns {Promise}
   */
  workspaceChangedDebounced = () => {
    return this.workspaceChanged(false);
  };

  /**
   * Save workspace. Debounced by default.
   *
   * @param {boolean} debounce
   *
   * @returns {Promise}
   */
  workspaceChanged = (debounce = true) => {
    if (debounce) {
      return this.workspaceChangedDebounced();
    }

    const {
      onWorkspaceChanged
    } = this.props;

    if (typeof onWorkspaceChanged !== 'function') {
      return;
    }

    const {
      layout,
      tabs,
      activeTab
    } = this.state;

    return onWorkspaceChanged({
      tabs,
      activeTab,
      layout
    });
  };

  /**
   * Propagates errors to parent.
   * @param {Error} error
   * @param {Tab|string} [categoryOrTab]
   */
  handleError = (error, categoryOrTab) => {

    this.emit('app.error-handled', error);

    const {
      onError
    } = this.props;

    return onError(error, categoryOrTab);
  };

  getGlobal = (name) => {
    const {
      globals
    } = this.props;

    if (name in globals) {
      return globals[name];
    }

    throw new Error(`global <${name}> not exposed`);
  };

  /**
   * Propagates warnings to parent.
   * @param {Error|{ message: string }} warning
   * @param {Tab|string} [categoryOrTab]
   */
  handleWarning(warning, categoryOrTab) {
    const {
      onWarning
    } = this.props;

    return onWarning(warning, categoryOrTab);
  }

  /**
   * Open log and add entry.
   *
   * @param {string} message - Message to be logged.
   * @param {string} category - Category of message.
   * @param {string} action - Action to be triggered.
   * @param {bool} silent - Log without opening the panel.
   */
  logEntry(message, category, action, silent) {

    if (!silent) {
      this.openPanel('log');
    }

    const logEntry = {
      category,
      message
    };

    if (action) {
      assign(logEntry, {
        action
      });
    }

    this.setState((state) => {

      const {
        logEntries
      } = state;

      return {
        logEntries: [
          ...logEntries,
          logEntry
        ]
      };
    });
  }

  /**
   * Display notification.
   *
   * @param {Object} options
   * @param {string} options.title
   * @param {import('react').ReactNode} [options.content]
   * @param {'info'|'success'|'error'|'warning'} [options.type='info']
   * @param {number} [options.duration=4000]
   *
   * @returns {{ update: (options: object) => void, close: () => void }}
   */
  displayNotification({ type = 'info', title, content, duration = 4000 }) {
    const { notifications } = this.state;

    if (!NOTIFICATION_TYPES.includes(type)) {
      throw new Error('Unknown notification type');
    }

    if (!isString(title)) {
      throw new Error('Title should be string');
    }

    const id = this.currentNotificationId++;

    const close = () => {
      this._closeNotification(id);
    };

    const update = newProps => {
      this._updateNotification(id, newProps);
    };

    const notification = {
      content,
      duration,
      id,
      close,
      title,
      type
    };

    this.setState({
      notifications: [
        ...notifications,
        notification
      ]
    });

    return {
      close,
      update
    };
  }

  closeNotifications() {
    this.setState({
      notifications: []
    });
  }

  _updateNotification(id, options) {
    const notifications = this.state.notifications.map(notification => {
      const { id: currentId } = notification;

      return currentId !== id ? notification : { ...notification, ...options };
    });

    this.setState({ notifications });
  }

  _closeNotification(id) {
    const notifications = this.state.notifications.filter(({ id: currentId }) => currentId !== id);

    this.setState({ notifications });
  }

  setLayout(layout) {
    this.setState({
      layout
    });
  }

  /**
   * Asks the user whether to retry the save action.
   * @param {Tab} tab
   * @param {Error} err
   * @param {Function} dialogHandler
   */
  async askForSaveRetry(tab, err, dialogHandler) {
    const { message } = err;

    const {
      name
    } = tab;

    return await this.showSaveFileErrorDialog(dialogHandler({
      message,
      name
    }));
  }

  /**
   * Saves current tab to given location
   * @param {string} options.encoding
   * @param {File} options.originalFile
   * @param {string} options.savePath
   * @param {string} options.saveType
   *
   * @returns {File} saved file.
   */
  async saveTabAsFile(options) {

    const {
      encoding,
      originalFile,
      savePath,
      saveType
    } = options;

    const fileSystem = this.getGlobal('fileSystem');


    const contents = await this.tabRef.current.triggerAction('save');

    return fileSystem.writeFile(savePath, {
      ...originalFile,
      contents
    }, {
      encoding,
      fileType: saveType
    });

  }

  /**
   * Asks the user for file path to save.
   * @param {Tab} tab
   */
  async askForSave(tab, options) {
    const {
      tabsProvider
    } = this.props;

    const {
      file,
      name,
      type: fileType
    } = tab;

    let {
      saveAs
    } = options;

    const provider = tabsProvider.getProvider(fileType);
    const saveType = provider.extensions[0];

    let savePath;

    saveAs = saveAs || this.isUnsaved(tab);

    if (saveAs) {
      const filters = getSaveFileDialogFilters(provider);

      savePath = await this.showSaveFileDialog(file, {
        filters,
        title: `Save ${ name } as...`
      });
    } else {
      savePath = tab.file.path;
    }

    if (!savePath) {
      return false;
    }

    const encoding = provider.encoding ? provider.encoding : ENCODING_UTF8;

    return {
      encoding,
      originalFile: file,
      savePath,
      saveType
    };

  }

  async saveTab(tab, options) {

    this.triggerAction('saveTab.start');

    options = options || {};

    // do as long as it was successful or cancelled
    // eslint-disable-next-line no-constant-condition
    while (true) {

      try {

        await this.showTab(tab);

        const saveOptions = await this.askForSave(tab, options);

        if (!saveOptions) {
          return false;
        }

        const savedFile = await this.saveTabAsFile(saveOptions);

        return this.tabSaved(tab, savedFile);
      } catch (err) {

        const { button } = await this.askForSaveRetry(tab, err, getSaveFileErrorDialog);

        if (button !== 'retry') {

          // cancel
          return false;
        }

      }

    }

  }

  saveAllTabs = () => {

    const {
      tabs
    } = this.state;

    const saveTasks = tabs
      .filter((tab) => {
        return this.isDirty(tab) || this.isUnsaved(tab);
      }).map((tab) => {
        return () => this.saveTab(tab);
      });

    return pSeries(saveTasks);
  };

  clearLog = () => {
    this.setState({
      logEntries: []
    });
  };

  openPanel = (tab = 'log') => {
    const { layout = {} } = this.state;

    const { panel = {} } = layout;

    this.handleLayoutChanged({
      panel: {
        ...panel,
        open: true,
        tab
      }
    });
  };

  closePanel() {
    const { layout = {} } = this.state;

    const { panel = {} } = layout;

    this.handleLayoutChanged({
      panel: {
        ...panel,
        open: false
      }
    });
  }

  closeTabs = (matcher) => {

    const {
      tabs
    } = this.state;

    const allTabs = tabs.slice();

    const closeTasks = allTabs.filter(matcher).map((tab) => {
      return () => this.closeTab(tab);
    });

    return pSeries(closeTasks);
  };

  revealInFileExplorer = (filePath) => {
    return this.getGlobal('dialog').showFileExplorerDialog({ path: filePath });
  };

  reopenLastTab = () => {

    const lastTab = this.closedTabs.pop();

    if (lastTab) {
      this.addTab(lastTab);

      return this.showTab(lastTab);
    }

    return Promise.reject(new Error('no last tab'));
  };

  showShortcuts = () => this.openModal('KEYBOARD_SHORTCUTS');

  /**
   * Update menu with provided state which can include `windowMenu` as well as `editMenu`.
   * Pass a falsy value to use current tab state for the updated menu.
   * @param {object} [options]
   */
  updateMenu = options => {
    if (!options) {
      options = this.state.tabState;
    }

    const { onMenuUpdate } = this.props;

    onMenuUpdate({
      ...options,
      activeTab: this.state.activeTab,
      lastTab: !!this.closedTabs.get(),
      closedTabs: this.state.recentTabs,
      tabs: this.state.tabs
    });
  };

  /**
   * Exports file to given export type.
   *
   * @param {string} options.encoding
   * @param {string} options.exportPath
   * @param {string} options.exportType
   * @param {File} options.originalFile
   */
  async exportAsFile(options) {
    const {
      encoding,
      exportType,
      exportPath,
      originalFile,
    } = options;

    const fileSystem = this.getGlobal('fileSystem');

    try {
      const contents = await this.tabRef.current.triggerAction('export-as', {
        fileType: exportType
      });

      return fileSystem.writeFile(exportPath, {
        ...originalFile,
        contents
      }, {
        encoding,
        fileType: exportType
      });
    } catch (err) {
      this.logEntry(err.message, 'ERROR');
    }
  }

  /**
   * Asks the user for file type to export.
   * @param {Tab} tab
   */
  async askForExportType(tab) {
    const {
      tabsProvider
    } = this.props;

    const {
      file: originalFile,
      name,
      type
    } = tab;

    const provider = tabsProvider.getProvider(type);

    const filters = getExportFileDialogFilters(provider);

    const exportPath = await this.showSaveFileDialog(tab, {
      filters,
      title: `Export ${ name } as...`
    });

    if (!exportPath) {
      return false;
    }

    const exportType = getFileTypeFromExtension(exportPath);

    // handle missing extension / export type as abortion
    // this ensures file export does not fail on Linux,
    // cf. https://github.com/camunda/camunda-modeler/issues/1699
    if (provider.exports && !provider.exports[exportType]) {
      return false;
    }

    const { encoding } = provider.exports && provider.exports[ exportType ] || ENCODING_UTF8;

    return {
      encoding,
      exportPath,
      exportType,
      originalFile
    };
  }

  async exportAs(tab) {

    // do as long as it was successful or cancelled
    const infinite = true;

    while (infinite) {

      try {

        const exportOptions = await this.askForExportType(tab);

        return exportOptions ? await this.exportAsFile(exportOptions) : false;
      } catch (err) {
        console.error('Tab export failed', err);

        const { button } = await this.askForSaveRetry(tab, err, getExportFileErrorDialog);

        if (button !== 'retry') {

          // cancel
          return;
        }

      }

    }

  }

  showDialog(options) {
    return this.getGlobal('dialog').show(options);
  }

  triggerAction = failSafe((action, options = {}) => {

    const {
      activeTab
    } = this.state;


    log('App#triggerAction %s %o', action, options);

    if (action === 'set-tab-group') {
      const {
        id,
        group
      } = options;

      return this.setTabGroup(id, group);
    }

    if (action === 'lint-tab') {
      const {
        tab,
        contents
      } = options;

      return this.lintTab(tab, contents);
    }

    if (action === 'select-tab') {
      if (options === 'next') {
        this.navigate(1);
      }

      if (options === 'previous') {
        this.navigate(-1);
      }

      return;
    }

    if (action === 'create-bpmn-diagram') {
      return this.createDiagram('bpmn');
    }

    if (action === 'create-dmn-diagram') {
      return this.createDiagram('dmn');
    }

    if (action === 'create-form') {
      return this.createDiagram('form');
    }

    if (action === 'create-cloud-form') {
      return this.createDiagram('cloud-form');
    }

    if (action === 'create-cloud-bpmn-diagram') {
      return this.createDiagram('cloud-bpmn');
    }

    if (action === 'create-cloud-dmn-diagram') {
      return this.createDiagram('cloud-dmn');
    }

    if (action === 'create-diagram') {
      return this.createDiagram(options.type);
    }

    if (action === 'reopen-file') {
      return this.openFiles([ options.file ]);
    }

    if (action === 'open-diagram') {
      const { path } = options;

      if (path) {
        return this.readFileFromPath(path).then(file => this.openFiles([ file ]));
      }

      return this.showOpenFilesDialog();
    }

    if (action === 'save-all') {
      return this.saveAllTabs();
    }

    if (action === 'save-tab') {
      return this.saveTab(options.tab);
    }

    if (action === 'save') {
      return this.saveTab(activeTab);
    }

    if (action === 'save-as') {
      return this.saveTab(activeTab, { saveAs: true });
    }

    if (action === 'quit') {
      return this.quit();
    }

    if (action === 'close-all-tabs') {
      return this.closeTabs(t => true);
    }

    if (action === 'close-tab') {
      return this.closeTabs(t => options && t.id === options.tabId);
    }

    if (action === 'close-active-tab') {
      let activeId = this.state.activeTab.id;

      return this.closeTabs(t => t.id === activeId);
    }

    if (action === 'close-other-tabs') {
      let activeId = options && options.tabId || this.state.activeTab.id;

      return this.closeTabs(t => t.id !== activeId);
    }

    if (action === 'reopen-last-tab') {
      return this.reopenLastTab();
    }

    if (action === 'reveal-in-file-explorer') {
      return this.revealInFileExplorer(options.filePath);
    }

    if (action === 'show-shortcuts') {
      return this.showShortcuts();
    }

    if (action === 'update-menu') {
      return this.updateMenu(options);
    }

    if (action === 'export-as') {
      return this.exportAs(activeTab);
    }

    if (action === 'show-dialog') {
      return this.showDialog(options);
    }

    if (action === 'open-modal') {
      return this.setModal(options);
    }

    if (action === 'close-modal') {
      return this.setModal(null);
    }

    if (action === 'open-external-url') {
      return this.openExternalUrl(options);
    }

    if (action === 'check-file-changed') {
      return this.checkFileChanged(activeTab);
    }

    if (action === 'notify-focus-change') {
      return this.emit('app.focus-changed');
    }

    if (action === 'resize') {
      return this.resizeTab();
    }

    if (action === 'reload-modeler') {
      return this.reloadModeler();
    }

    if (action === 'restart-modeler') {
      return this.reloadModeler(true);
    }

    if (action === 'log') {
      const {
        action,
        category,
        message,
        silent
      } = options;

      return this.logEntry(message, category, action, silent);
    }

    if (action === 'open-log') {
      return this.openPanel('log');
    }

    if (action === 'open-panel') {
      const { tab } = options;

      return this.openPanel(tab);
    }

    if (action === 'close-panel') {
      return this.closePanel();
    }

    if (action === 'display-notification') {
      return this.displayNotification(options);
    }

    if (action === 'emit-event') {
      const {
        type,
        payload
      } = options;

      return this.emitWithTab(type, activeTab, payload);
    }

    if (action === 'toggle-panel') {
      const { panel } = this.state.layout;
      return panel.open ? this.closePanel() : this.openPanel(panel.tab);
    }

    if (action === 'settings-open') {
      return this.emit('app.settings-open');
    }

    if (action === 'open-deployment') {
      return this.emitWithTab('app.open-deployment', activeTab);
    }

    const tab = this.tabRef.current;

    return tab.triggerAction(action, options);
  }, this.handleError);

  openExternalUrl(options) {
    this.getGlobal('backend').send('external:open-url', options);
  }

  openModal = modal => this.triggerAction('open-modal', modal);

  closeModal = () => {
    this.updateMenu(this.state.tabState);
    this.triggerAction('close-modal');
  };

  setModal = currentModal => this.setState({ currentModal });

  handleCloseTab = (tab) => {
    this.triggerAction('close-tab', { tabId: tab.id }).catch(console.error);
  };

  handleDrop = async (filePaths = []) => {
    try {
      const files = await this.readFileList(filePaths);

      await this.openFiles(files);
    } catch (error) {
      this.handleError(error);
    }
  };

  _getFilePath = async (file) => {
    const fileSystem = this.getGlobal('fileSystem');
    return fileSystem.getFilePath(file);
  };

  getConfig = (key, ...args) => {
    const config = this.getGlobal('config');

    const { activeTab } = this.state;

    const { file } = activeTab;

    return config.get(key, file, ...args);
  };

  setConfig = (key, ...args) => {
    const config = this.getGlobal('config');

    return config.set(key, ...args);
  };

  getPlugins = type => {
    return this.getGlobal('plugins').get(type);
  };

  async quit() {
    const { tabs } = this.state;

    let canQuit = true;
    for (const tab of tabs) {
      canQuit = await this.saveBeforeClose(tab);

      if (!canQuit) {
        break;
      }
    }

    try {
      await this.workspaceChanged(false);
    } catch (error) {
      log('workspace saved error', error);
    }

    return canQuit;
  }

  composeAction = (...args) => {

    const actionName = args[0];

    this.__actionCache = this.__actionCache || {};

    const cachedAction = this.__actionCache[actionName];

    if (cachedAction) {
      const lastArgs = cachedAction.args;

      const changed = lastArgs.length !== args.length || lastArgs.find((arg, idx) => {
        return arg !== args[idx];
      });

      if (!changed) {
        return cachedAction.fn;
      }

      if (process.env.NODE_ENV === 'development') {
        console.warn('re-defining App#composeAction args', args);
      }
    }

    const fn = async (event) => {
      await this.triggerAction(...args);
    };

    this.__actionCache[actionName] = { fn, args };

    return fn;
  };

  _onTabOpened(tab) {
    if (!this.isUnsaved(tab)) {
      const {
        file,
        type
      } = tab;

      this.getGlobal('backend').send('file-context:file-opened', file.path, {
        processor: getProcessor(type)
      });
    }
  }

  _onTabClosed(tab) {
    if (!this.isUnsaved(tab)) {
      const { file } = tab;

      this.getGlobal('backend').send('file-context:file-closed', file.path);
    }
  }

  _onTabSaved(tab) {
    const {
      file,
      type
    } = tab;

    this.getGlobal('backend').send('file-context:file-updated', file.path, {
      processor: getProcessor(type)
    });
  }

  render() {

    const {
      tabs,
      tabGroups,
      activeTab,
      layout,
      logEntries
    } = this.state;

    const isDirty = (tab) => {
      return this.isUnsaved(tab) || this.isDirty(tab);
    };

    const Tab = this.getTabComponent(activeTab);

    return (
      <DropZone
        getFilePath={ this._getFilePath }
        onDrop={ this.handleDrop }
      >

        <div className={ css.App }>

          <KeyboardInteractionTrapContext.Provider value={ this.triggerAction }>

            <SlotFillRoot>

              <div className="tabs">
                <TabLinks
                  tabs={ tabs }
                  tabGroups={ tabGroups }
                  isDirty={ isDirty }
                  activeTab={ activeTab }
                  getTabIcon={ this._getTabIcon }
                  onSelect={ this.selectTab }
                  onMoveTab={ this.moveTab }
                  onContextMenu={ this.openTabLinksMenu }
                  onClose={ this.handleCloseTab }
                  placeholder={ tabs.length ? false : {
                    label: 'Welcome',
                    title: 'Welcome Screen'
                  } }
                  draggable
                />

                <TabContainer className="main">
                  {
                    <Tab
                      key={ activeTab.id }
                      tab={ activeTab }
                      layout={ layout }
                      linting={ this.getLintingState(activeTab) }
                      onChanged={ this.handleTabChanged(activeTab) }
                      onError={ this.handleTabError(activeTab) }
                      onWarning={ this.handleTabWarning(activeTab) }
                      onShown={ this.handleTabShown(activeTab) }
                      onLayoutChanged={ this.handleLayoutChanged }
                      onContextMenu={ this.openTabMenu }
                      onAction={ this.triggerAction }
                      onModal={ this.openModal }
                      onUpdateMenu={ this.updateMenu }
                      getConfig={ this.getConfig }
                      setConfig={ this.setConfig }
                      getPlugins={ this.getPlugins }
                      ref={ this.tabRef }
                      settings={ this.getGlobal('settings') }
                      backend={ this.getGlobal('backend') }
                      config={ this.getGlobal('config') }
                      deployment={ this.getGlobal('deployment') }
                      startInstance={ this.getGlobal('startInstance') }
                      zeebeApi={ this.getGlobal('zeebeAPI') }
                    />
                  }
                </TabContainer>
              </div>

              <PanelContainer
                layout={ layout }
                onLayoutChanged={ this.handleLayoutChanged }>
                <Panel
                  layout={ layout }
                  onLayoutChanged={ this.handleLayoutChanged }
                  onUpdateMenu={ this.updateMenu } />

                <LogTab
                  layout={ layout }
                  entries={ logEntries }
                  onClear={ this.clearLog }
                  onAction={ this.triggerAction } />

                <LintingTab
                  layout={ layout }
                  linting={ this.getLintingState(activeTab) }
                  onAction={ this.triggerAction } />
              </PanelContainer>

              <StatusBar />

              <PluginsRoot
                app={ this }
                plugins={ this.plugins }
              />

            </SlotFillRoot>

            { this.state.currentModal === 'KEYBOARD_SHORTCUTS' ?
              <KeyboardShortcutsModal
                getGlobal={ this.getGlobal }
                onClose={ this.closeModal }
              /> : null }

          </KeyboardInteractionTrapContext.Provider>

        </div>

        <Notifications notifications={ this.state.notifications } />

      </DropZone>
    );
  }

  _getNewFileItems = () => {

    // TODO: make this configurable
    let items = [];

    const providers = this.props.tabsProvider.getProviders();

    forEach(providers, provider => {
      const entries = provider.getNewFileMenu && provider.getNewFileMenu();

      if (!entries || !entries.length) {
        return;
      }

      items = [
        ...items,
        ...entries.map(entry => {
          return {
            text: entry.label,
            group: entry.group,
            icon: provider.getIcon(),
            onClick: () => this.triggerAction(entry.action, entry.options)
          };
        })
      ];

    });

    const groupedItems = map(groupBy(items, 'group'), (group, key) => {
      return {
        items: group,
        key,
        label: key
      };
    });

    return groupedItems;
  };

  _getTabIcon = (tab) => {
    const {
      tabsProvider
    } = this.props;

    const {
      type
    } = tab;

    return tabsProvider.getTabIcon(type);
  };
}


function missingProvider(providerType) {
  class MissingProviderTab extends PureComponent {

    componentDidMount() {
      this.props.onShown();
    }

    render() {
      return (
        <Tab key="missing-provider">
          <span>
            Cannot open tab: no provider for { providerType }.
          </span>
        </Tab>
      );
    }
  }

  return MissingProviderTab;
}

class LoadingTab extends PureComponent {

  triggerAction() {}

  render() {
    return (
      <Tab key="loading">
        <Loader />
      </Tab>
    );
  }

}

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

export default WithCache(App);

// helpers //////////

export function getOpenFileErrorDialog(options) {
  const {
    name,
    providerNames
  } = options;

  // format provider names as string
  const providerNamesString = providerNames.reduce((string, providerName, index) => {
    const isFirst = index === 0,
          isLast = index === providerNames.length - 1;

    let seperator = '';

    if (isLast && !isFirst) {
      seperator = ' or ';
    } else if (!isFirst) {
      seperator = ', ';
    }

    return `${ string }${ seperator }${ providerName }`;
  }, '');

  return {
    message: 'Unable to open file.',
    detail: `"${ name }" is not a ${ providerNamesString } file.`
  };
}

function getSaveFileErrorDialog(options) {
  const {
    message,
    name
  } = options;

  return {
    buttons: [
      { id: 'cancel', label: 'Cancel' },
      { id: 'retry', label: `Save ${ name } as...` }
    ],
    message: [
      `${ name } could not be saved.`,
      '',
      'Error:',
      message
    ].join('\n'),
    title: 'Save Error'
  };
}

function getExportFileErrorDialog(options) {
  const {
    message,
    name
  } = options;

  return {
    buttons: [
      { id: 'cancel', label: 'Cancel' },
      { id: 'retry', label: `Export ${ name } as...` }
    ],
    message: [
      `${ name } could not be exported.`,
      '',
      'Error:',
      message
    ].join('\n'),
    title: 'Export Error'
  };
}


function getFileTypeFromExtension(filePath) {
  return filePath.split('.').pop();
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

function getOpenFilesDialogFilters(providers) {
  const allSupportedFilter = {
    name: 'All Supported',
    extensions: []
  };

  let filters = [];

  forEach(providers, provider => {
    const {
      extensions,
      name
    } = provider;

    if (!extensions) {
      return;
    }

    allSupportedFilter.extensions = [
      ...allSupportedFilter.extensions,
      ...extensions
    ];

    filters.push({
      name,
      extensions: [ ...extensions ]
    });
  });

  // remove duplicates, sort alphabetically
  allSupportedFilter.extensions = allSupportedFilter.extensions
    .reduce((extensions, extension) => {
      if (extensions.includes(extension)) {
        return extensions;
      } else {
        return [
          ...extensions,
          extension
        ];
      }
    }, [])
    .sort();

  // sort alphabetically
  filters = filters.sort((a, b) => {
    if (a.name < b.name) {
      return -1;
    }

    if (a.name > b.name) {
      return 1;
    }

    return 0;
  });

  return [
    allSupportedFilter,
    ...filters,
    FILTER_ALL_EXTENSIONS
  ];
}

function getSaveFileDialogFilters(provider) {
  const {
    extensions,
    name
  } = provider;

  return [ {
    name,
    extensions
  }, FILTER_ALL_EXTENSIONS ];
}

function getExportFileDialogFilters(provider) {
  const filters = [];

  forEach(provider.exports, (exports) => {
    const {
      extensions,
      name
    } = exports;

    filters.push({
      name,
      extensions
    });
  });

  return filters;
}


function failSafe(fn, errorHandler) {

  return async (...args) => {

    try {
      return await fn(...args);
    } catch (error) {
      errorHandler(error);
    }
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
