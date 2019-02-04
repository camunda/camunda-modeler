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

    exec().catch(this.handleError);
  }

  handleOpenFiles = (event, newFiles) => {
    log('open files', newFiles);

    const { prereadyState } = this;

    // schedule file opening on ready
    if (prereadyState) {
      this.prereadyState = {
        activeFile: newFiles[newFiles.length - 1],
        files: [
          ...prereadyState.files,
          ...newFiles
        ]
      };

      return;
    }

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

    await workspace.save(workspaceConfig);

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
      files: [
        ...prereadyState.files,
        ...files
      ]
    };

    log('workspace restored');
  }

  handleError = (error, tab) => {

    if (tab) {
      return log('tab ERROR', error, tab);
    }

    return log('app ERROR', error);
  }

  handleWarning = (warning, tab) => {
    if (tab) {
      return log('tab warning', warning, tab);
    }

    return log('app warning', warning);
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

  handleStarted = async () => {

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

  componentDidMount() {
    const { keyboardBindings } = this.props;

    const backend = this.getBackend();

    backend.on('menu:action', this.triggerAction);

    backend.on('client:open-files', this.handleOpenFiles);

    backend.once('client:started', this.handleStarted);

    backend.on('client:window-focused', (event) => {
      this.triggerAction(event, 'check-file-changed');
    });

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