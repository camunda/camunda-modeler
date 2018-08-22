import React, { Component } from 'react';

import debug from 'debug';

import App from './App';


const log = debug('AppParent');


export default class AppParent extends Component {

  constructor() {
    super();

    this.appRef = React.createRef();
  }

  triggerAction = (event, action) => {
    log('trigger action', action);

    const {
      backend
    } = this.props.globals;

    const promise = this.getApp().triggerAction(action);

    if (action === 'quit') {
      promise.then(
        backend.sendQuitAllowed,
        backend.sendQuitAborted
      );
    }
  }

  openFiles = (event, files) => {
    log('open files', files);

    this.getApp().openFiles(files);
  }

  handleToolStateChanged = (tab, state) => {
    this.getBackend().updateMenu(state);
  }

  handleReady = () => {
    this.getBackend().sendReady();
  }

  getApp() {
    return this.appRef.current;
  }

  getBackend() {
    return this.props.globals.backend;
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
      backend
    } = this.props.globals;

    backend.off('menu:action', this.triggerAction);

    backend.off('client:open-files', this.openFiles);
  }

  render() {
    return (
      <App
        ref={ this.appRef }
        globals={ this.props.globals }
        onToolStateChanged={ this.handleToolStateChanged }
        onReady={ this.handleReady }
      />
    );
  }

}