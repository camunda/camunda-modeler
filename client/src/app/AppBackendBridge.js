import { Component } from 'react';

import debug from 'debug';

const log = debug('AppBackendBridge');


export default class AppBackendBridge extends Component {

  triggerAction = (event, action) => {
    log('trigger action', action);

    const {
      app,
      backend
    } = this.props;

    const promise = app.triggerAction(action);

    if (action === 'quit') {
      promise.then(
        backend.sendQuitAllowed,
        backend.sendQuitAborted
      );
    }
  }

  openFiles = (event, files) => {
    log('open files', files);

    this.props.app.openFiles(files);
  }

  componentDidMount() {

    const {
      backend
    } = this.props;

    backend.on('menu:action', this.triggerAction);

    backend.on('client:open-files', this.openFiles);

    backend.once('client:started', () => {
      document.body.classList.remove('loading');
    });

    log('sending ready');

    backend.sendReady();
  }

  componentWillUnmount() {

    const {
      backend
    } = this.props;

    backend.off('menu:action', this.triggerAction);

    backend.off('client:open-files', this.openFiles);
  }

  render() {
    return null;
  }

}