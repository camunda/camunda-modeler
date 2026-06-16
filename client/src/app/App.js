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
  map,
  reduce
} from 'min-dash';

import EventEmitter from 'events';

import defaultPlugins from '../plugins';

import getActionRegistry from './getActionRegistry';

import LintingManager from './LintingManager';

import FileManager from './FileManager';

import NotificationManager from './NotificationManager';

import LayoutManager from './LayoutManager';

import ModalManager from './ModalManager';

import LogManager from './LogManager';

import DialogManager, { FILTER_ALL_EXTENSIONS } from './DialogManager';

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

import * as css from './App.css';

import Notifications from './notifications';
import { RecentTabs } from './RecentTabs';
import { EventsContext } from './EventsContext';
import { AppContext } from './AppContext';

const log = debug('App');

export const EMPTY_TAB = {
  id: '__empty',
  type: 'empty'
};

const ENCODING_UTF8 = 'utf8';



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
  connectionCheckResult: null,
  engineProfiles: {},
  logEntries: [],
  notifications: [],
  currentModal: null
};

/**
 * @typedef { {
 *   contents: string,
 *   path?: string
 * } } File
 */

/**
 * @typedef { {
 *   encoding: string,
 *   originalFile: File,
 *   savePath: string,
 *   saveType: string
 * } } SaveFileOptions
 */


/**
 * The main application component, manages tabs, navigation and event routing.
 */
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
    this.eventsContext = {
      subscribe: (event, listener) => {
        this.on(event, listener);
        return {
          cancel: () => this.off(event, listener)
        };
      }
    };

    // TODO(nikku): make state
    this.closedTabs = new History();
    this.recentTabs = new RecentTabs({
      setState: value => this.setState({ recentTabs: value }),
      config: this.getGlobal('config')
    });

    this.tabRef = React.createRef();

    this.lintingManager = new LintingManager(this);

    this.fileManager = new FileManager(this);

    this.notificationManager = new NotificationManager(this);

    this.layoutManager = new LayoutManager(this);

    this.modalManager = new ModalManager(this);

    this.logManager = new LogManager(this);

    this.dialogManager = new DialogManager(this);

    this.on('connectionManager.connectionStatusChanged',
      this.lintingManager.handleConnectionStatusChanged);
    this.on('connectionManager.connectionCheckStarted', this.lintingManager.handleConnectionCheckStarted);
    this.on('tab.engineProfileChanged',
      this.lintingManager.handleEngineProfileChanged);

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

    this.on('app.blurred', this.triggerAutoSave);

    this.on('app.focused', () => {
      this.triggerAction('check-file-changed');
    });

    this.actionRegistry = getActionRegistry(this);

    this.appContext = {
      triggerAction: this.triggerAction,
      getGlobal: this.getGlobal
    };
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
      return;
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
  async showTab(tab) {

    const {
      activeTab,
      tabShown
    } = this.state;

    if (activeTab === tab) {
      return tabShown.promise;
    }

    // auto-save the previously active tab when switching (async, non-blocking)
    if (activeTab !== tab && this.shouldAutoSave(activeTab)) {

      const contents = await this.getActiveTabContents();

      // asynchronously invoke save
      this.autoSaveWithContents(activeTab, contents).catch(err => {

        // should never happen; auto-save is fail-safe
        this.handleError(err);
      });
    }

    // trigger file changed in background
    tab = await this.checkFileChanged(tab);

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

    try {

      // disable auto-save during <save-all> to prevent
      // interferring with user save decisions
      this.off('app.blurred', this.triggerAutoSave);

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
    } finally {

      // restore auto-save
      this.on('app.blurred', this.triggerAutoSave);
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

    const {
      [ tab.id ]: _removedProfile,
      ...newEngineProfiles
    } = this.state.engineProfiles;

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

    return new Promise((resolve) => {
      this.setState({
        tabs: newTabs,
        openedTabs: newOpenedTabs,
        engineProfiles: newEngineProfiles
      }, () => {
        this.props.cache.destroy(tab.id);
        resolve();
      });
    });
  }

  triggerAutoSave = () => {
    const { activeTab } = this.state;

    activeTab && this.autoSave(activeTab);
  };

  /**
   * Select a tab, de-selecting the previous tab.
   *
   * This method is an alias of {@link App#showTab}, bound to the {@link App} instance.
   */
  selectTab = tab => {
    return this.showTab(tab);
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

  showOpenFilesDialog = () => {
    return this.dialogManager.showOpenFilesDialog();
  };

  showCloseFileDialog = (file) => {
    return this.dialogManager.showCloseFileDialog(file);
  };

  showSaveFileDialog = (file, options = {}) => {
    return this.dialogManager.showSaveFileDialog(file, options);
  };

  showSaveFileErrorDialog(options) {
    return this.dialogManager.showSaveFileErrorDialog(options);
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

      await this.showTab(tab);

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
      const activeTab = activateFile && openedTabs.find(t => t.file && t.file.path === activateFile.path) || openedTabs[openedTabs.length - 1];

      if (activeTab) {
        await this.showTab(activeTab);
      }
    }

    return openedTabs;
  };

  readFileList = (filePaths) => {
    return this.fileManager.readFileList(filePaths);
  };

  readFileFromPath = (filePath) => {
    return this.fileManager.readFileFromPath(filePath);
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
    return this.layoutManager.handleLayoutChanged(newLayout);
  };


  /**
   * Mark tab as shown if it's active tab, otherwise ignore.
   *
   * @param {Tab} tab
   */
  handleTabShown = (tab) => {
    if (tab !== this.state.activeTab) {
      return;
    }

    const {
      openedTabs,
      activeTab,
      tabShown
    } = this.state;

    tabShown.resolve();

    this.setState({
      openedTabs: {
        ...openedTabs,
        [activeTab.id]: true
      },
      tabLoadingState: 'shown'
    });
  };

  /**
   * Handle tab error if it is active tab, otherwise ignore.
   *
   * @param {Tab} tab
   * @param {Error} error
   */
  handleTabError = (tab, error) => {
    if (tab !== this.state.activeTab) {
      return;
    }

    this.handleError(error, this.state.activeTab);
  };

  /**
   * Handle tab warning if it is active tab, otherwise ignore.
   *
   * @param {Tab} tab
   * @param {Error|{ message: string }} warning
   */
  handleTabWarning = (tab, warning) => {
    if (tab !== this.state.activeTab) {
      return;
    }

    this.handleWarning(warning, this.state.activeTab);
  };

  /**
   * Handle tab changed if it is active tab, otherwise ignore.
   *
   * @param {Tab} tab
   * @param {Object} properties
   */
  handleTabChanged = (tab, properties = {}) => {
    if (tab !== this.state.activeTab) {
      return;
    }

    const {
      activeTab,
      tabState
    } = this.state;

    let dirtyState = {};

    if ('dirty' in properties) {
      dirtyState = this.setDirty(activeTab, properties.dirty);
    }

    this.setState({
      ...dirtyState,
      tabState: {
        ...tabState,
        ...properties
      }
    });
  };

  lintTab = (tab, contents) => {
    return this.lintingManager.lintTab(tab, contents);
  };

  getLintingState = (tab) => {
    return this.lintingManager.getLintingState(tab);
  };

  setLintingState = (tab, results) => {
    return this.lintingManager.setLintingState(tab, results);
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

    if (layout !== prevState.layout) {
      this.emit('layout.changed', {
        prevLayout: prevState.layout,
        layout
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
   * @param {boolean} silent - Log without opening the panel.
   */
  logEntry(message, category, action, silent) {
    return this.logManager.logEntry(message, category, action, silent);
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
  displayNotification(options) {
    return this.notificationManager.displayNotification(options);
  }

  closeNotifications() {
    return this.notificationManager.closeNotifications();
  }

  setLayout(layout) {
    return this.layoutManager.setLayout(layout);
  }

  /**
   * Asks the user whether to retry the save action.
   * @param {Tab} tab
   * @param {Error} err
   * @param {Function} dialogHandler
   */
  async askForSaveRetry(tab, err, dialogHandler) {
    return this.dialogManager.askForSaveRetry(tab, err, dialogHandler);
  }

  /**
   * Return contents of active tab.
   *
   * @return {Promise<string>} - tab contents
   */
  getActiveTabContents() {

    if (!this.tabRef.current) {
      throw new Error('no active tab reference');
    }

    return this.tabRef.current.triggerAction('save');
  }

  /**
   * Saves current tab to given location
   *
   * @param {string} options.encoding
   * @param {File} options.originalFile
   * @param {string} options.savePath
   * @param {string} options.saveType
   * @param {string} contents
   *
   * @returns {Promise<File>} saved file.
   */
  async saveTabAsFile(options, contents) {
    return this.fileManager.saveTabAsFile(options, contents);
  }

  /**
   * Migrate configuration for file if file path changed and config exists.
   *
   * @param {File} oldFile - Old file with old path
   * @param {File} newFile - New file with new path
   */
  async migrateConfigForFile(oldFile, newFile) {
    return this.fileManager.migrateConfigForFile(oldFile, newFile);
  }


  /**
   * Asks the user for file path to save.
   *
   * @param { Tab} tab
   *
   * @param { object } options
   * @param { boolean } [options.saveAs=false]
   *
   * @return { Promise<SaveFileOptions|false> }
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

    const {
      saveAs
    } = options;

    const provider = tabsProvider.getProvider(fileType);
    const saveType = provider.extensions[0];

    let savePath;

    if (saveAs || this.isUnsaved(tab)) {
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

    await this.triggerAction('saveTab.start');

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

        const contents = await this.getActiveTabContents();

        const savedFile = await this.saveTabAsFile(saveOptions, contents);

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

  /**
   * Check if a tab should be auto-saved.
   *
   * A tab should be auto-saved if it is:
   * - Not an empty tab
   * - Dirty (has unsaved changes)
   * - Previously saved (has a file path)
   *
   * @param {Tab} [tab] - the tab to check
   *
   * @returns {boolean} - whether the tab should be auto-saved
   */
  shouldAutoSave(tab) {
    return tab && !this.isEmptyTab(tab) && this.isDirty(tab) && !this.isUnsaved(tab);
  }

  /**
   * Auto-save a previously saved tab, if needed.
   *
   * Does NOT prompt the user for a save location.
   *
   * @param {Tab} tab - The tab to auto-save
   *
   * @returns {Promise<Tab|false>} - The saved tab or false if not saved
   */
  async autoSave(tab) {

    if (!this.shouldAutoSave(tab)) {
      return false;
    }

    if (tab !== this.state.activeTab) {
      throw new Error('cannot auto-save non-active tab');
    }

    const contents = await this.getActiveTabContents();

    return this.autoSaveWithContents(tab, contents);
  }

  /**
   * Auto-saves the given tab with contents.
   *
   * Does NOT prompt the user for a save location.
   *
   * @param {Tab} tab - the tab to auto-save
   * @param {string} contents - the tab contents
   *
   * @returns {Promise<Tab|false>} - The saved tab or false if not saved
   */
  async autoSaveWithContents(tab, contents) {

    const {
      tabsProvider
    } = this.props;

    const {
      file,
      type: fileType
    } = tab;

    const provider = tabsProvider.getProvider(fileType);
    const saveType = provider.extensions[0];
    const encoding = provider.encoding || ENCODING_UTF8;

    try {
      const savedFile = await this.saveTabAsFile({
        encoding,
        originalFile: file,
        savePath: file.path,
        saveType
      }, contents);

      return this.tabSaved(tab, savedFile);
    } catch (err) {
      this.handleAutoSaveError(tab, err);

      return false;
    }
  }

  /**
   * Handle error during auto-save.
   *
   * @param {Tab} tab - the tab that failed to save
   * @param {Error} err - the error that occurred
   */
  handleAutoSaveError(tab, err) {

    console.error(`failed to auto-save tab ${tab.name}`, err);

    this.displayNotification({
      type: 'error',
      title: 'Auto-save failed',
      content: `Could not auto-save "${tab.name}": ${err.message}`,
      duration: 4000
    });
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
    return this.logManager.clearLog();
  };

  openPanel = (tab = 'log') => {
    return this.layoutManager.openPanel(tab);
  };

  closePanel() {
    return this.layoutManager.closePanel();
  }

  openSidePanel = (tab = 'properties') => {
    return this.layoutManager.openSidePanel(tab);
  };

  closeSidePanel() {
    return this.layoutManager.closeSidePanel();
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

  showShortcuts = () => this.modalManager.showShortcuts();

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
    return this.fileManager.exportAsFile(options);
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

    log('App#triggerAction %s %o', action, options);

    const handler = this.actionRegistry.get(action);

    if (handler) {
      return handler(options);
    }

    const tab = this.tabRef.current;

    return tab.triggerAction(action, options);
  }, this.handleError);

  openExternalUrl(options) {
    this.getGlobal('backend').send('external:open-url', options);
  }

  openModal = modal => this.modalManager.openModal(modal);

  closeModal = () => this.modalManager.closeModal();

  setModal = currentModal => this.modalManager.setModal(currentModal);

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

          <EventsContext.Provider value={ this.eventsContext }>

            <AppContext.Provider value={ this.appContext }>

              <KeyboardInteractionTrapContext.Provider value={ this.triggerAction }>

                <SlotFillRoot>

                  <div className="tabs">
                    <TabLinks
                      tabs={ tabs }
                      tabGroups={ tabGroups }
                      isDirty={ isDirty }
                      activeTab={ activeTab }
                      config={ this.getGlobal('config') }
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
                          onChanged={ this.handleTabChanged }
                          onError={ this.handleTabError }
                          onWarning={ this.handleTabWarning }
                          onShown={ this.handleTabShown }
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
                      onClear={ this.clearLog } />

                    <LintingTab
                      layout={ layout }
                      linting={ this.getLintingState(activeTab) } />
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

            </AppContext.Provider>

          </EventsContext.Provider>

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
      this.props.onShown(this.props.tab);
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
