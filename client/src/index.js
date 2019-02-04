import React from 'react';
import ReactDOM from 'react-dom';

import {
  AppParent,
  KeyboardBindings,
  TabsProvider
} from './app';

import {
  backend,
  config,
  dialog,
  fileSystem,
  plugins,
  metadata,
  workspace
} from './remote';

import Metadata from './util/Metadata';

import debug from 'debug';

if (process.env.NODE_ENV !== 'production') {
  debug.enable('*,-sockjs-client:*');
}

const isMac = backend.getPlatform() === 'darwin';

const keyboardBindings = new KeyboardBindings({
  isMac
});

const tabsProvider = new TabsProvider();

const globals = {
  backend,
  config,
  dialog,
  fileSystem,
  isMac,
  plugins,
  workspace
};

Metadata.init(metadata);

async function render() {

  // load plugins
  plugins.bindHelpers(window);

  await plugins.loadAll();

  const rootElement = document.getElementById('root');

  const onStarted = () => {
    // mark as finished loading
    document.body.classList.remove('loading');
  };

  ReactDOM.render(
    <AppParent
      keyboardBindings={ keyboardBindings }
      globals={ globals }
      tabsProvider={ tabsProvider }
      onStarted={ onStarted }
    />, rootElement
  );
}

render();

