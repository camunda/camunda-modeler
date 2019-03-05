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
  debounce,
  forEach,
  reduce
} from 'min-dash';

import executeOnce from './util/executeOnce';

import { WithCache } from './cached';

import { DropZone } from './drop-zone';

import {
  Fill,
  SlotFillRoot
} from './slot-fill';

import Toolbar from './Toolbar';

import Log from './Log';


import { ModalConductor } from './modals';

import {
  Button,
  DropdownButton,
  TabLinks,
  TabContainer,
  Tab,
  Icon,
  Loader
} from './primitives';

import pDefer from 'p-defer';
import pSeries from 'p-series';

import History from './History';

import css from './App.less';


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
  layout: {},
  tabs: [],
  tabState: {},
  logEntries: [],
  currentModal: null,
  endpoints: []
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

    // TODO(nikku): make state
    this.closedTabs = new History();

    this.tabRef = React.createRef();

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
      this.workspaceChanged = debounce(this.workspaceChanged, 1500);
      this.updateMenu = debounce(this.updateMenu, 50);
      this.resizeTab = debounce(this.resizeTab, 50);
    }
  }

  createDiagram = async (type = 'bpmn', options) => {

    const {
      tabsProvider
    } = this.props;

    const tab = this.addTab(
      tabsProvider.createTab(type, options)
    );

    await this.showTab(tab);

    return tab;
  }

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

    const {
      globals
    } = this.props;

    const {
      fileSystem
    } = globals;

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

    const answer = await this.showDialog(getContentChangedDialog());

    if (answer === 'ok') {
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
  }

  /**
   * Update the tab with new attributes.
   *
   * @param {Tab} tab
   * @param {Object} newAttrs
   * @param {Object} [newState={}]
   */
  updateTab(tab, newAttrs, newState={}) {

    if (newAttrs.id && newAttrs.id !== tab.id) {
      throw new Error('must not change tab.id');
    }

    const updatedTab = {
      ...tab,
      ...newAttrs
    };

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
   * Close tab.
   *
   * @param {Tab} tab
   *
   * @return {Promise<Boolean>} resolved to true if tab is closed
   */
  closeTab = async (tab) => {
    const { file } = tab;

    const { name } = file;

    if (this.isDirty(tab)) {
      const response = await this.showCloseFileDialog({ name });

      if (response === 'save') {
        await this.saveTab(tab);
      } else if (response === 'cancel') {
        return false;
      }
    }

    await this._removeTab(tab);

    return true;
  }

  isEmptyTab = (tab) => {
    return tab === EMPTY_TAB;
  }

  isDirty = (tab) => {
    return !!this.state.dirtyTabs[tab.id];
  }

  isUnsaved = (tab) => {
    const { unsavedTabs } = this.state;
    const { id, file } = tab;

    return unsavedTabs[id] || (file && !file.path);
  }

  async _removeTab(tab) {

    const {
      tabs,
      activeTab,
      openedTabs
    } = this.state;

    const {
      navigationHistory,
      closedTabs
    } = this;

    const {
      ...newOpenedTabs
    } = openedTabs;

    delete newOpenedTabs[tab.id];

    const newTabs = tabs.filter(t => t !== tab);

    navigationHistory.purge(tab);

    if (!this.isUnsaved(tab)) {
      closedTabs.push(tab);
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
  }

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
  }

  showOpenFilesDialog = async () => {
    const {
      globals,
      tabsProvider
    } = this.props;

    const {
      activeTab
    } = this.state;

    const {
      dialog
    } = globals;

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
  }

  showCloseFileDialog = (file) => {
    const { globals } = this.props;

    const { dialog } = globals;

    const { name } = file;

    return dialog.showCloseFileDialog({ name });
  }

  showSaveFileDialog = (file, options = {}) => {
    const { globals } = this.props;

    const { dialog } = globals;

    const {
      filters,
      title
    } = options;

    return dialog.showSaveFileDialog({
      file,
      filters,
      title
    });
  }

  showSaveFileErrorDialog(options) {
    const { globals } = this.props;

    const { dialog } = globals;

    return dialog.showSaveFileErrorDialog(options);
  }

  openEmptyFile = async (file) => {
    const {
      globals,
      tabsProvider
    } = this.props;

    const { dialog } = globals;

    const { name } = file;

    const fileType = getFileTypeFromExtension(name);

    if (!tabsProvider.hasProvider(fileType)) {
      let providerNames = tabsProvider.getProviderNames();

      await dialog.showOpenFileErrorDialog(getOpenFileErrorDialog({
        name,
        providerNames
      }));

      return;
    }

    const response = await dialog.showEmptyFileDialog({
      file,
      type: fileType
    });

    if (response == 'create') {

      let tab = this.addTab(
        tabsProvider.createTabForFile({
          ...file,
          contents: tabsProvider.getInitialFileContents(fileType)
        }),
        { unsaved: true }
      );

      await this.selectTab(tab);

      return tab;
    }
  }

  /**
   * Open the given files, optionally passing a file
   * that should be active after the operation.
   *
   * File activation may be disabled by explicitly passing
   * `false` as the activeFile. Otherwise it will either activate
   * the tab corresponding to the activeFile or the last opened tab.
   *
   * @param {Array<File>} files
   * @param {File|Boolean} activateFile
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
  }

  readFileList = async filePaths => {
    const readOperations = filePaths.map(this.readFileFromPath);

    const rawFiles = await Promise.all(readOperations);

    const files = rawFiles.filter(Boolean);

    return files;
  }

  readFileFromPath = async (filePath) => {
    const {
      globals,
      tabsProvider
    } = this.props;

    const fileType = getFileTypeFromExtension(filePath);

    const provider = tabsProvider.getProvider(fileType);

    const encoding = provider.encoding ? provider.encoding : ENCODING_UTF8;

    let file = null;

    try {
      file = await globals.fileSystem.readFile(filePath, {
        encoding
      });
    } catch (error) {
      if (error.code === 'EISDIR') {
        return this.handleError(new Error(`Cannot open directory: ${filePath}`));
      }

      this.handleError(error);
    }

    return file;
  }

  /**
   * Find existing tabs for given files. If no tab was found for one tab,
   * create a new one.
   * @param {Array<File>} files
   * @param {TabsProvider} tabsProvider
   *
   * @returns {Array<Tab>}
   */
  async findOrCreateTabs(files, tabsProvider) {
    const openedTabs = await Promise.all(files.slice().reverse().map(async (file) => {
      let tab;

      if (!file.contents.length) {
        tab = await this.openEmptyFile(file);
      } else {
        tab = this.findOpenTab(file);
        if (!tab) {
          const newTab = tabsProvider.createTabForFile(file);
          if (newTab) {
            tab = this.addTab(newTab);
          }
        }
      }

      return tab;
    })).then(tabs => {
      // filter out empty elements
      return tabs.filter(tab => tab);
    });

    return openedTabs.slice().reverse();
  }

  findOpenTab(file) {

    const {
      tabs
    } = this.state;

    return tabs.find(t => t.file && t.file.path === file.path);
  }

  openTabLinksMenu = (tab, event) => {
    event.preventDefault();

    this.props.onContextMenu('tab', { tabId: tab.id });
  }

  openTabMenu = (event, type, context) => {
    event.preventDefault();

    this.props.onContextMenu(type);
  }

  handleLayoutChanged = (newLayout) => {
    const {
      layout
    } = this.state;

    this.setLayout({
      ...layout,
      ...newLayout
    });
  }


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
  }

  /**
   * Handle tab error.
   *
   * @param {Object} tab descriptor
   *
   * @return {Function} tab error callback
   */
  handleTabError = (tab) => (error) => {
    this.handleError(error, tab);
  }

  /**
   * Handle tab warning.
   *
   * @param {Object} tab descriptor
   *
   * @return {Function} tab warning callback
   */
  handleTabWarning = (tab) => (warning) => {
    this.handleWarning(warning, tab);
  }

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
  }

  resizeTab = () => {
    const tab = this.tabRef.current;

    return tab.triggerAction('resize');
  }

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
  }

  componentDidUpdate(prevProps, prevState) {

    const {
      activeTab,
      tabs,
      tabLoadingState,
      tabState,
      layout,
      endpoints
    } = this.state;

    const {
      onTabChanged,
      onTabShown
    } = this.props;

    if (prevState.activeTab !== activeTab) {
      if (typeof onTabChanged === 'function') {
        onTabChanged(activeTab, prevState.activeTab);
      }
    }

    if (tabLoadingState === 'shown' && prevState.tabLoadingState !== 'shown') {
      if (typeof onTabShown === 'function') {
        onTabShown(activeTab);
      }
    }

    if (
      activeTab !== prevState.activeTab ||
      tabs !== prevState.tabs ||
      layout !== prevState.layout ||
      endpoints !== prevState.endpoints
    ) {
      this.workspaceChanged();
    }


    if (tabState !== prevState.tabState) {
      this.updateMenu(tabState);
    }

    if (layout !== prevState.layout) {
      this.triggerAction('resize');
    }
  }

  componentDidCatch(error, info) {
    this.handleError(error);
  }

  workspaceChanged = () => {

    const {
      onWorkspaceChanged
    } = this.props;

    if (typeof onWorkspaceChanged !== 'function') {
      return;
    }

    const {
      layout,
      tabs,
      activeTab,
      endpoints
    } = this.state;

    onWorkspaceChanged({
      tabs,
      activeTab,
      layout,
      endpoints
    });
  }

  /**
   * Propagates errors to parent.
   * @param {Error} error
   * @param {Tab} [tab]
   */
  handleError(error, tab) {
    const {
      onError
    } = this.props;

    return onError(error, tab);
  }

  /**
   * Propagates warnings to parent.
   * @param {Error} error
   * @param {Tab} [tab]
   */
  handleWarning(warning, tab) {
    const {
      onWarning
    } = this.props;

    return onWarning(warning, tab);
  }

  /**
   *
   * @param {String} message - Message to be logged.
   * @param {String} category - Category of message.
   */
  logEntry(message, category) {
    const {
      logEntries
    } = this.state;

    this.toggleLog(true);

    this.setState({
      logEntries: [
        ...logEntries,
        {
          category,
          message
        }
      ]
    });
  }

  setLayout(layout) {
    this.setState({
      layout
    });
  }

  async saveTab(tab, options = {}) {
    await this.showTab(tab);

    const {
      globals,
      tabsProvider
    } = this.props;

    const { fileSystem } = globals;

    const fileType = tab.type;

    const provider = tabsProvider.getProvider(fileType);

    const {
      file,
      name
    } = tab;

    const contents = await this.tabRef.current.triggerAction('save');

    let filePath, filters;

    let { saveAs } = options;

    saveAs = saveAs || this.isUnsaved(tab);

    if (saveAs) {
      filters = getSaveFileDialogFilters(provider);

      filePath = await this.showSaveFileDialog(file, {
        filters,
        title: `Save ${ name } as...`
      });
    } else {
      filePath = tab.file.path;
    }

    if (!filePath) {
      return;
    }

    const encoding = provider.encoding ? provider.encoding : ENCODING_UTF8;

    const newFile = await fileSystem.writeFile(filePath, {
      ...file,
      contents
    }, {
      encoding,
      fileType
    }).catch(async err => {
      let { message } = err;

      let response = await this.showSaveFileErrorDialog(getSaveFileErrorDialog({
        message,
        name
      }));

      if (response === 'save-as') {

        // try again
        await this.saveTab(tab, { saveAs: true });
      }
    });

    if (!newFile) {
      return;
    }

    this.tabSaved(tab, newFile);
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
  }

  clearLog = () => {
    this.setState({
      logEntries: []
    });
  };

  toggleLog = (open) => {
    this.handleLayoutChanged({
      log: {
        ...this.state.layout.log,
        open
      }
    });
  };

  closeTabs = (matcher) => {

    const {
      tabs
    } = this.state;

    const allTabs = tabs.slice();

    const closeTasks = allTabs.filter(matcher).map((tab) => {
      return () => this.closeTab(tab);
    });

    return pSeries(closeTasks);
  }

  reopenLastTab = () => {

    const lastTab = this.closedTabs.pop();

    if (lastTab) {
      this.addTab(lastTab);

      return this.showTab(lastTab);
    }

    return Promise.reject(new Error('no last tab'));
  }

  showShortcuts = () => this.openModal('KEYBOARD_SHORTCUTS');

  updateMenu = (options) => {
    const { onMenuUpdate } = this.props;

    onMenuUpdate({
      ...options,
      tabsCount: this.state.tabs.length,
      lastTab: !!this.closedTabs.get()
    });
  }

  async exportAs(tab) {
    const {
      globals,
      tabsProvider
    } = this.props;

    const { fileSystem } = globals;

    const {
      name,
      type
    } = tab;

    const provider = tabsProvider.getProvider(type);

    const filters = getExportFileDialogFilters(provider);

    const filePath = await this.showSaveFileDialog(tab, {
      filters,
      title: `Export ${ name } as...`
    });

    if (!filePath) {
      return;
    }

    const fileType = getFileTypeFromExtension(filePath);

    if (!fileType) {
      return;
    }

    const contents = await this.tabRef.current.triggerAction('export-as', {
      fileType
    });

    const { encoding } = provider.exports ? provider.exports[ fileType ] : ENCODING_UTF8;

    await fileSystem.writeFile(filePath, {
      ...tab.file,
      contents
    }, {
      encoding,
      fileType
    }).catch(async err => {
      const { message } = err;

      let response = await this.showSaveFileErrorDialog(getExportFileErrorDialog({
        message,
        name
      }));

      if (response === 'export-as') {

        // try again
        await this.exportAs(tab);
      }
    });
  }

  showDialog(options) {
    const {
      globals
    } = this.props;

    return globals.dialog.show(options);
  }

  triggerAction = (action, options) => {

    const {
      activeTab
    } = this.state;


    log('App#triggerAction %s %o', action, options);

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

    if (action === 'create-dmn-table') {
      return this.createDiagram('dmn', { table: true });
    }

    if (action === 'create-cmmn-diagram') {
      return this.createDiagram('cmmn');
    }

    if (action === 'open-diagram') {
      return this.showOpenFilesDialog();
    }

    if (action === 'save-all') {
      return this.saveAllTabs();
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

    if (action === 'show-shortcuts') {
      return this.showShortcuts();
    }

    if (action === 'update-menu') {
      return this.updateMenu();
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

    if (action === 'resize') {
      return this.resizeTab();
    }

    if (action === 'log') {
      const {
        category,
        message
      } = options;

      return this.logEntry(message, category);
    }

    const tab = this.tabRef.current;

    return tab.triggerAction(action, options);
  }

  openExternalUrl(options) {
    this.props.globals.backend.send('external:open-url', options);
  }

  openModal = modal => this.triggerAction('open-modal', modal);

  closeModal = () => {
    this.updateMenu(this.state.tabState);
    this.triggerAction('close-modal');
  };

  setModal = currentModal => this.setState({ currentModal });

  setEndpoints = endpoints => this.setState({ endpoints });

  handleDeploy = async (options) => {
    await this.triggerAction('save');

    const { file } = this.state.activeTab;

    if (!file || !file.path) {
      return false;
    }

    return this.props.globals.backend.send('deploy', { ...options, file });
  };

  handleDeployError = (error) => {
    this.logEntry(`Deploy error: ${JSON.stringify(error)}`, 'deploy-error');
  }

  handleCloseTab = (tab) => {
    this.triggerAction('close-tab', { tabId: tab.id }).catch(console.error);
  }

  handleDrop = async (files) => {
    const filePaths = Array.from(files).map(({ path }) => path);

    try {
      const files = await this.readFileList(filePaths);

      await this.openFiles(files);
    } catch (error) {
      this.handleError(error);
    }
  }

  loadConfig = (key, ...args) => {
    return this.props.globals.config.get(key, this.state.activeTab, ...args);
  }

  getPlugins = type => {
    const { globals } = this.props;

    const { plugins } = globals;

    return plugins.get(type);
  }

  async quit() {
    const closeResults = await this.triggerAction('close-all-tabs');

    return closeResults.every(result => result);
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
  }

  render() {

    const {
      tabs,
      activeTab,
      tabState,
      layout,
      logEntries,
      dirtyTabs,
      unsavedTabs
    } = this.state;

    const Tab = this.getTabComponent(activeTab);

    const canSave = this.isUnsaved(activeTab) || this.isDirty(activeTab);
    const canSaveAs = !this.isEmptyTab(activeTab);

    const {
      tabsProvider
    } = this.props;

    return (
      <DropZone
        onDrop={ this.handleDrop }
      >

        <div className={ css.App }>

          <SlotFillRoot>

            <Toolbar />

            <Fill name="toolbar" group="general">
              <DropdownButton
                title="Create diagram"
                items={ [
                  {
                    text: 'Create new BPMN diagram',
                    onClick: this.composeAction('create-bpmn-diagram'),
                    type: 'bpmn'
                  },
                  {
                    text: 'Create new DMN table',
                    onClick: this.composeAction('create-dmn-table'),
                    type: 'dmn'
                  },
                  {
                    text: 'Create new DMN diagram (DRD)',
                    onClick: this.composeAction('create-dmn-diagram'),
                    type: 'dmn'
                  },
                  {
                    text: 'Create new CMMN diagram',
                    onClick: this.composeAction('create-cmmn-diagram'),
                    type: 'cmmn'
                  }
                ].filter(entry => tabsProvider.hasProvider(entry.type)) }
              >
                <Icon name="new" />
              </DropdownButton>

              <Button
                title="Open diagram"
                onClick={ this.composeAction('open-diagram') }
              >
                <Icon name="open" />
              </Button>
            </Fill>

            <Fill name="toolbar" group="save">
              <Button
                disabled={ !canSave }
                onClick={ canSave ? this.composeAction('save') : null }
                title="Save diagram"
              >
                <Icon name="save" />
              </Button>
              <Button
                disabled={ !canSaveAs }
                onClick={ canSaveAs ? this.composeAction('save-as') : null }
                title="Save diagram as..."
              >
                <Icon name="save-as" />
              </Button>
            </Fill>

            <Fill name="toolbar" group="editor">
              <Button
                disabled={ !tabState.undo }
                onClick={ this.composeAction('undo') }
                title="Undo last action"
              >
                <Icon name="undo" />
              </Button>
              <Button
                disabled={ !tabState.redo }
                onClick={ this.composeAction('redo') }
                title="Redo last action"
              >
                <Icon name="redo" />
              </Button>
            </Fill>

            {
              tabState.exportAs && <Fill name="toolbar" group="export">
                <Button
                  title="Export as image"
                  onClick={ this.composeAction('export-as') }
                >
                  <Icon name="picture" />
                </Button>
              </Fill>
            }

            <div className="tabs">
              <TabLinks
                className="primary"
                tabs={ tabs }
                dirtyTabs={ dirtyTabs }
                unsavedTabs={ unsavedTabs }
                activeTab={ activeTab }
                onSelect={ this.selectTab }
                onMoveTab={ this.moveTab }
                onContextMenu={ this.openTabLinksMenu }
                onClose={ this.handleCloseTab }
                placeholder={ {
                  label: '+',
                  title: 'New BPMN diagram',
                  onClick: this.composeAction('create-bpmn-diagram')
                } }
                draggable
                scrollable
              />

              <TabContainer className="main">
                {
                  <Tab
                    key={ activeTab.id }
                    tab={ activeTab }
                    layout={ layout }
                    onChanged={ this.handleTabChanged(activeTab) }
                    onError={ this.handleTabError(activeTab) }
                    onWarning={ this.handleTabWarning(activeTab) }
                    onShown={ this.handleTabShown(activeTab) }
                    onLayoutChanged={ this.handleLayoutChanged }
                    onContextMenu={ this.openTabMenu }
                    onAction={ this.triggerAction }
                    onModal={ this.openModal }
                    onLoadConfig={ this.loadConfig }
                    getPlugins={ this.getPlugins }
                    ref={ this.tabRef }
                  />
                }
              </TabContainer>
            </div>

            <Log
              entries={ logEntries }
              layout={ layout.log }
              onClear={ this.clearLog }
              onLayoutChanged={ this.handleLayoutChanged }
            />
          </SlotFillRoot>

          <ModalConductor
            currentModal={ this.state.currentModal }
            endpoints={ this.state.endpoints }
            isMac={ this.props.globals.isMac }
            onClose={ this.closeModal }
            onDeploy={ this.handleDeploy }
            onDeployError={ this.handleDeployError }
            onEndpointsUpdate={ this.setEndpoints }
            onMenuUpdate={ this.updateMenu }
          />

        </div>

      </DropZone>
    );
  }
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

function getOpenFileErrorDialog(options) {
  const {
    name,
    providerNames
  } = options;

  // format provider names as string
  const providerNamesString = providerNames.reduce((string, providerName, index) => {
    const isFirst = index === 0,
          isLast = index === providerNames.length - 1;

    let seperator = '';

    if (isLast) {
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
      { id: 'save-as', label: `Save ${ name } as...` }
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
      { id: 'export-as', label: `Export ${ name } as...` }
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

  return [{
    name,
    extensions
  }, FILTER_ALL_EXTENSIONS];
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
