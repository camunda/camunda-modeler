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

import App from './App';

import {
  forEach
} from 'min-dash';


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

  handleError = (error, tab) => {

    const errorMessage = this.getErrorMessage(tab);

    this.logToBackend(error, tab);

    this.logToClient('error', error, tab);

    log(errorMessage, error, tab);
  }

  handleBackendError = (_, message) => {
    this.logToClient('error', { message });
  }

  getErrorMessage(tab) {
    return `${tab ? 'tab' : 'app'} ERROR`;
  }

  handleWarning = (warning, tab) => {

    const warningMessage = this.getWarningMessage(tab);

    this.logToClient('warning', warning, tab);

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
   * @param {string} category
   * @param {Error|{ message: string }} errorLike
   * @param {Tab} tab
   */
  logToClient(category, errorLike, tab) {
    const entry = this.getLogEntry(category, errorLike, tab);

    this.triggerAction(null, 'log', entry);
  }

  getLogEntry(category, errorLike, tab) {
    const message = this.getEntryMessage(errorLike, tab);

    return {
      category,
      message
    };
  }

  /**
   *
   * @param {Error} error
   * @param {Tab} [tab]
   */
  logToBackend(error, tab) {
    const entry = this.getBackendLogEntry(error, tab);

    this.props.globals.log.error(entry);
  }

  /**
   * Creates entry transferrable to backend.
   * @param {Error} error
   * @param {Tab} [tab]
   *
   * @returns {{ message: string, stack: string }}
   */
  getBackendLogEntry(error, tab) {
    const entry = {
      message: this.getEntryMessage(error, tab),
      stack: error.stack
    };

    return entry;
  }

  getEntryMessage(errorLike, tab) {
    const {
      message: originalMessage,
      stack
    } = errorLike;

    let message = originalMessage;

    if (tab) {
      const prefix = this.getTabPrefix(tab);
      message = `[${prefix}] ${message}`;
    }

    if (stack) {
      message = `${message}\n${stack}`;
    }

    return message;
  }

  getTabPrefix(tab) {
    if (tab.file && tab.file.path) {
      return tab.file.path;
    } else if (tab.file && tab.file.name) {
      return tab.file.name;
    } else {
      return tab.id;
    }
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