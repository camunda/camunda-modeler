import React, { Component } from 'react';

// import debug from 'debug';

import App from './App';


const log = console.log;
// debug('AppParent');


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