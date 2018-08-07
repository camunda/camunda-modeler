import React from 'react';
import ReactDOM from 'react-dom';

import debug from 'debug';

import { App } from './app';

import mitt from 'mitt';

import {
  backend
} from './remote';

const log = debug('client');

const eventBus = mitt();


eventBus.on('app:ready', function() {
  log('client is ready');

  document.body.classList.remove('loading');

  backend.send('client:ready');
});

eventBus.on('app:fileOpen', function(event) {
  backend.send('file:open', event.cwd);
});


// TODO(nikku): implement this hooking into the app
backend.on('menu:action', function(e, action) {
  if (action === 'quit') {
    log('client is quitting');

    backend.send('app:quit-allowed');
  }
});

backend.on('client:open-files', function(e, files) {
  log('opening external files: ', files);

  eventBus.emit('client:open-files', {
    files
  });
});

backend.on('client:window-focused', function(e) {
  log('window focused');

  eventBus.emit('client:window-focused');
});


const rootElement = document.getElementById('root');
ReactDOM.render(<App globals={ { eventBus, backend } } />, rootElement);
