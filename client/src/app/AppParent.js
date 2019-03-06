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
  forEach
} from 'min-dash';

import {
  mapStackTrace
} from 'sourcemapped-stacktrace';

import App from './App';

const log = debug('AppParent');


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
    } catch (error) {
      return log('workspace saved error', error);
    }

    log('workspace saved', workspaceConfig);
  }

  restoreWorkspace = async () => {

    const workspace = this.getWorkspace();

    const { prereadyState } = this;

    const defaultConfig = {
      activeFile: -1,
      files: [],
      layout: {},
      endpoints: []
    };

    const {
      files,
      activeFile,
      layout,
      endpoints
    } = await workspace.restore(defaultConfig);

    const app = this.getApp();

    app.setLayout(layout);

    app.setEndpoints(endpoints);

    // remember to-be restored files but postpone opening + activation
    // until <client:started> batch restore workspace files + files opened
    // via command line
    this.prereadyState = {
      activeFile: prereadyState.activeFile || files[activeFile],
      files: mergeFiles(prereadyState.files, files)
    };

    log('workspace restored');
  }

  handleError = async (error, tab) => {

    const errorMessage = this.getErrorMessage(tab);

    const entry = await getErrorEntry(error, tab);

    this.logToBackend(entry.backend);

    this.logToClient(entry.client);

    log(errorMessage, error, tab);
  }

  handleBackendError = async (_, message) => {
    const entry = await getErrorEntry({ message });

    this.logToClient(entry.client);
  }

  getErrorMessage(tab) {
    return `${tab ? 'tab' : 'app'} ERROR`;
  }

  handleWarning = async (warning, tab) => {

    const warningMessage = this.getWarningMessage(tab);

    const { client: entry } = await getWarningEntry(warning, tab);

    this.logToClient(entry);

    log(warningMessage, warning, tab);
  }

  getWarningMessage(tab) {
    return `${tab ? 'tab' : 'app'} warning`;
  }

  handleReady = async () => {

    try {
      await this.restoreWorkspace();
    } catch (e) {
      log('failed to restore workspace', e);
    }

    this.getBackend().sendReady();
  }

  handleResize = () => this.triggerAction(null, 'resize');

  handleFocus = (event) => {
    this.triggerAction(event, 'check-file-changed');
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
   *
   * @param {Object} entry
   * @param {string} entry.category
   * @param {string} entry.message
   */
  logToClient(entry) {
    this.triggerAction(null, 'log', entry);
  }

  /**
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
 * @param {Tab} [tab]
 */
function getErrorEntry(body, tab) {
  return getLogEntry(body, 'error', tab);
}

/**
 *
 * @param {Error|{ message: string }} body
 * @param {Tab} [tab]
 */
function getWarningEntry(body, tab) {
  return getLogEntry(body, 'warning', tab);
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
 */
function getClientEntry(category, message) {
  return {
    category,
    message
  };
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
    const prefix = getTabPrefix(tab);
    message = `[${prefix}] ${message}`;
  }

  if (stack) {
    const parsedStack = await parseStackTrace(stack);

    message = `${message}\n${parsedStack}`;
  }

  return message;
}

function getTabPrefix(tab) {
  if (tab.file && tab.file.path) {
    return tab.file.path;
  } else if (tab.file && tab.file.name) {
    return tab.file.name;
  } else {
    return tab.id;
  }
}

async function parseStackTrace(stack) {
  const stackFrames = await new Promise(resolve => {
    mapStackTrace(stack, resolve);
  });

  return stackFrames.join('\n');
}
