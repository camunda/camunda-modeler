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
  forEach,
  isString
} from 'min-dash';

import {
  mapStackTrace
} from 'sourcemapped-stacktrace';

import App from './App';

import Flags, { DISABLE_PLUGINS, RELAUNCH } from '../util/Flags';

const log = debug('AppParent');

const DEFAULT_CONFIG = {
  activeFile: -1,
  files: [],
  layout: {},
  endpoints: []
};


export default class AppParent extends PureComponent {

  constructor(props) {
    super(props);

    this.prereadyState = {
      files: [],
      workspace: {}
    };

    this.appRef = React.createRef();
  }

  triggerAction = (event, action, options) => {

    // fail-safe trigger given action
    const exec = async () => {

      log('trigger action %s, %o', action, options);

      const {
        backend
      } = this.props.globals;

      const result = await this.getApp().triggerAction(action, options);

      if (action === 'quit') {

        if (result) {
          backend.sendQuitAllowed();
        } else {
          backend.sendQuitAborted();
        }
      }

    };

    return exec().catch(this.handleError);
  }

  handleOpenFiles = (event, newFiles) => {

    const { prereadyState } = this;

    // schedule file opening on ready
    if (prereadyState) {

      log('scheduling open files', newFiles);

      this.prereadyState = {
        activeFile: newFiles[newFiles.length - 1],
        files: mergeFiles(prereadyState.files, newFiles)
      };

      return;
    }

    log('open files', newFiles);

    this.getApp().openFiles(newFiles);
  }

  handleMenuUpdate = (state = {}) => {
    const { keyboardBindings } = this.props;

    const { editMenu } = state;

    keyboardBindings.update(editMenu);

    this.getBackend().sendMenuUpdate(state);
  }

  handleContextMenu = (type, options) => {
    this.getBackend().showContextMenu(type, options);
  }

  handleWorkspaceChanged = async (config) => {

    const workspace = this.getWorkspace();

    // persist tabs backed by actual files only
    const files = config.tabs.filter(t => t.file && t.file.path).map((t) => {
      return t.file;
    });

    const activeTab = config.activeTab;

    const activeFile = files.indexOf(activeTab && activeTab.file);

    const layout = config.layout;

    const endpoints = config.endpoints;

    const workspaceConfig = {
      files,
      activeFile,
      layout,
      endpoints
    };

    try {
      await workspace.save(workspaceConfig);

      log('workspace saved', workspaceConfig);
    } catch (error) {
      log('workspace saved error', error);
    }
  }

  restoreWorkspace = async () => {

    const workspace = this.getWorkspace();

    let restored;

    try {
      restored = await workspace.restore(DEFAULT_CONFIG);
    } catch (e) {
      return log('failed to restore workspace', e);
    }

    const {
      activeFile,
      files,
      layout
    } = restored;

    const app = this.getApp();

    app.setLayout(layout);

    // remember to-be restored files but postpone opening + activation
    // until <client:started> batch restore workspace files + files opened
    // via command line
    this.prereadyState = {
      activeFile: this.prereadyState.activeFile || files[activeFile],
      files: mergeFiles(this.prereadyState.files, files)
    };

    log('workspace restored');
  }

  hasPlugins() {
    return this.getPlugins().getAppPlugins().length;
  }

  togglePlugins = () => {
    this.getBackend().sendTogglePlugins();
  }

  handleError = async (error, source) => {
    const errorMessage = this.getErrorMessage(source);

    const entry = await getErrorEntry(error, source);

    this.logToBackend(entry.backend);

    this.logToClient(entry.client);

    if (this.hasPlugins()) {
      this.logToClient(getClientEntry('info', 'This error may be the result of a plug-in compatibility issue.'));

      this.logToClient(getClientEntry('info', 'Disable plug-ins (restarts the app)', this.togglePlugins));
    }

    log(errorMessage, error, source);
  }

  handleBackendError = async (_, message) => {
    const entry = await getErrorEntry({ message });

    this.logToClient(entry.client);
  }

  getErrorMessage(categoryOrTab) {
    const prefix = categoryOrTab ? (isString(categoryOrTab) ? categoryOrTab : 'tab') : 'app';

    return `${prefix} ERROR`;
  }

  handleWarning = async (warning, source) => {

    const warningMessage = this.getWarningMessage(source);

    const { client: entry } = await getWarningEntry(warning, source);

    this.logToClient(entry);

    log(warningMessage, warning, source);
  }

  getWarningMessage(categoryOrTab) {
    const prefix = categoryOrTab ? (isString(categoryOrTab) ? categoryOrTab : 'tab') : 'app';

    return `${prefix} warning`;
  }

  handleReady = async () => {

    await this.restoreWorkspace();

    this.getBackend().sendReady();
  }

  handleResize = () => this.triggerAction(null, 'resize');

  handleFocus = (event) => {
    this.triggerAction(event, 'check-file-changed');
    this.triggerAction(event, 'notify-focus-change');
  }

  handleStarted = async () => {

    log('received <started>');

    const {
      onStarted
    } = this.props;

    // batch open / restore files
    const { prereadyState } = this;

    const {
      files,
      activeFile
    } = prereadyState;

    // mark as ready
    this.prereadyState = null;

    log('restoring / opening files', files, activeFile);

    await this.getApp().openFiles(files, activeFile);

    if (typeof onStarted === 'function') {
      onStarted();
    }
  }

  getApp() {
    return this.appRef.current;
  }

  getBackend() {
    return this.props.globals.backend;
  }

  getPlugins() {
    return this.props.globals.plugins;
  }

  getWorkspace() {
    return this.props.globals.workspace;
  }

  registerMenus() {
    const backend = this.getBackend();

    forEach(this.props.tabsProvider.getProviders(), (provider, type) => {
      const options = {
        helpMenu: provider.getHelpMenu && provider.getHelpMenu(),
        newFileMenu: provider.getNewFileMenu && provider.getNewFileMenu()
      };

      backend.registerMenu(type, options).catch(console.error);
    });
  }

  /**
   * Log a message to the client.
   *
   * @param {Object} entry
   * @param {string} entry.category
   * @param {string} entry.message
   * @param {string} entry.action
   */
  logToClient(entry) {
    this.triggerAction(null, 'log', entry);
  }

  /**
   * Log a message to the backend.
   *
   * @param {Object} entry
   * @param {string} entry.message
   * @param {string} entry.stack
   */
  logToBackend(entry) {
    this.props.globals.log.error(entry);
  }

  componentDidMount() {
    const { keyboardBindings } = this.props;

    const backend = this.getBackend();

    backend.on('menu:action', this.triggerAction);

    backend.on('client:open-files', this.handleOpenFiles);

    backend.once('client:started', this.handleStarted);

    backend.on('client:window-focused', this.handleFocus);

    backend.on('backend:error', this.handleBackendError);

    this.registerMenus();

    keyboardBindings.setOnAction(this.triggerAction);

    keyboardBindings.bind();

    window.addEventListener('resize', this.handleResize);

    if (Flags.get(DISABLE_PLUGINS) && Flags.get(RELAUNCH)) {
      this.logToClient(getClientEntry('info', 'Plugins are temporarily disabled.'));

      this.logToClient(getClientEntry('info', 'Enable plug-ins (restarts the app)', this.togglePlugins));
    }
  }

  componentWillUnmount() {
    const { keyboardBindings } = this.props;

    const {
      globals
    } = this.props;

    const {
      backend
    } = globals;

    backend.off('menu:action', this.triggerAction);

    backend.off('client:open-files', this.handleOpenFiles);

    backend.off('client:window-focused', this.handleFocus);

    backend.off('backend:error', this.handleBackendError);

    keyboardBindings.unbind();

    window.removeEventListener('resize', this.handleResize);
  }

  render() {
    const {
      tabsProvider,
      globals
    } = this.props;

    return (
      <App
        ref={ this.appRef }
        tabsProvider={ tabsProvider }
        globals={ globals }
        onMenuUpdate={ this.handleMenuUpdate }
        onContextMenu={ this.handleContextMenu }
        onWorkspaceChanged={ this.handleWorkspaceChanged }
        onReady={ this.handleReady }
        onError={ this.handleError }
        onWarning={ this.handleWarning }
      />
    );
  }

}


// helpers /////////////////////////

function mergeFiles(oldFiles, newFiles) {

  const actualNewFiles = newFiles.filter(newFile => !oldFiles.some(oldFile => oldFile.path === newFile.path));

  return [
    ...oldFiles,
    ...actualNewFiles
  ];
}


/**
 *
 * @param {Error|{ message: string }} body
 * @param {Tab|string} [source]
 */
function getErrorEntry(body, source) {
  return getLogEntry(body, 'error', source);
}

/**
 *
 * @param {Error|{ message: string }} body
 * @param {Tab|string} [source]
 */
function getWarningEntry(body, source) {
  return getLogEntry(body, 'warning', source);
}

/**
 *
 * @param {Error|{ message: string }} body
 * @param {string} category
 * @param {Tab} [tab]
 *
 * @returns entryObject
 */
async function getLogEntry(body, category, tab) {
  const message = await getEntryMessage(body, tab);

  return {
    backend: message,
    client: getClientEntry(category, message)
  };
}

/**
 *
 * @param {string} category
 * @param {string} message
 * @param {Function} [action]
 */
function getClientEntry(category, message, action) {
  const clientEntry = {
    category,
    message
  };

  if (action) {
    assign(clientEntry, {
      action
    });
  }

  return clientEntry;
}

/**
 *
 * @param {Error|{ message: string }} errorLike
 * @param {Tab} [tab]
 * @returns {string} message
 */
async function getEntryMessage(errorLike, tab) {
  const {
    message: originalMessage,
    stack
  } = errorLike;

  let message = originalMessage;

  if (tab) {
    const prefix = getSourcePrefix(tab);
    message = `[${prefix}] ${message}`;
  }

  if (stack) {
    const parsedStack = await parseStackTrace(stack);

    message = `${message}\n${parsedStack}`;
  }

  return message;
}

function getSourcePrefix(categoryOrTab) {
  if (isString(categoryOrTab)) {
    return categoryOrTab;
  } else if (categoryOrTab.file && categoryOrTab.file.path) {
    return categoryOrTab.file.path;
  } else if (categoryOrTab.file && categoryOrTab.file.name) {
    return categoryOrTab.file.name;
  } else {
    return categoryOrTab.id;
  }
}

async function parseStackTrace(stack) {
  const stackFrames = await new Promise(resolve => {
    mapStackTrace(stack, resolve);
  });

  return stackFrames.join('\n');
}
