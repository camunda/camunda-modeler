import React, { Component } from 'react';

import debug from 'debug';

import App from './App';


const log = debug('AppParent');


export default class AppParent extends Component {

  constructor() {
    super();

    this.appRef = React.createRef();
  }

  triggerAction = (event, action, options) => {
    log('trigger action', action, options);

    const {
      backend
    } = this.props.globals;

    const result = this.getApp().triggerAction(action, options);

    if (action === 'quit') {
      Promise.resolve(result).then(
        backend.sendQuitAllowed,
        backend.sendQuitAborted
      );
    }

    if (result && 'catch' in result) {
      result.catch(() => console.error);
    }
  }

  openFiles = (event, files) => {
    log('open files', files);

    this.getApp().openFiles(files);
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

    const workspaceConfig = {
      files,
      activeFile,
      layout
    };

    await workspace.save(workspaceConfig);

    log('workspace saved', workspaceConfig);
  }

  restoreWorkspace = async () => {

    const workspace = this.getWorkspace();

    const defaultConfig = {
      activeFile: null,
      files: [],
      layout: {}
    };

    this.restoringWorkspace = true;

    const {
      files,
      activeFile,
      layout
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

    log('workspace restored');

    this.restoringWorkspace = false;
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

  getApp() {
    return this.appRef.current;
  }

  getBackend() {
    return this.props.globals.backend;
  }

  getWorkspace() {
    return this.props.globals.workspace;
  }

  componentDidMount() {

    const backend = this.getBackend();

    backend.on('menu:action', this.triggerAction);

    backend.on('client:open-files', this.openFiles);

    backend.once('client:started', () => {
      document.body.classList.remove('loading');
    });
  }

  componentWillUnmount() {

    const {
      globals
    } = this.props;

    const {
      backend
    } = globals;

    backend.off('menu:action', this.triggerAction);

    backend.off('client:open-files', this.openFiles);
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
        onContextMenu={ this.handleContextMenu }
        onWorkspaceChanged={ this.handleWorkspaceChanged }
        onReady={ this.handleReady }
      />
    );
  }

}