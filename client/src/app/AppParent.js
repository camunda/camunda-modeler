import React, { PureComponent } from 'react';

import debug from 'debug';

import App from './App';

import { forEach } from 'min-dash';


const log = debug('AppParent');


export default class AppParent extends PureComponent {

  constructor(props) {
    super(props);

    this.appRef = React.createRef();
  }

  triggerAction = (event, action, options) => {
    log('trigger action', action, options);

    const {
      backend
    } = this.props.globals;

    let result = Promise.resolve(
      this.getApp().triggerAction(action, options)
    );

    if (action === 'quit') {
      result = result.then(
        backend.sendQuitAllowed,
        backend.sendQuitAborted
      );
    }

    result.catch(this.handleError);
  }

  openFiles = (event, files) => {
    log('open files', files);

    this.getApp().openFiles(files);
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

    if (this.restoringWorkspace) {
      return;
    }

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

    const defaultConfig = {
      activeFile: null,
      files: [],
      layout: {},
      endpoints: []
    };

    this.restoringWorkspace = true;

    const {
      files,
      activeFile,
      layout,
      endpoints
    } = await workspace.restore(defaultConfig);

    const app = this.getApp();

    app.setLayout(layout);

    await app.openFiles(files);

    if (activeFile) {
      const activeTab = app.findOpenTab(activeFile);

      if (activeTab) {
        await app.setActiveTab(activeTab);
      }
    }

    app.setEndpoints(endpoints);

    log('workspace restored');

    this.restoringWorkspace = false;
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

    // setTimeout(() => {
    //   const app = this.getApp();

    //   app.createDiagram('bpmn');
    //   app.createDiagram('bpmn');
    //   app.createDiagram('dmn');
    //   app.createDiagram('dmn', { table: true });
    //   app.createDiagram('cmmn');
    // }, 0);
  }

  handleResize = () => this.triggerAction(null, 'resize');

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

    backend.on('client:open-files', this.openFiles);

    backend.once('client:started', () => {
      document.body.classList.remove('loading');
    });

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

    backend.off('client:open-files', this.openFiles);

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