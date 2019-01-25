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
  await plugins.loadAll();

  const rootElement = document.getElementById('root');

  ReactDOM.render(
    <AppParent
      keyboardBindings={ keyboardBindings }
      globals={ globals }
      tabsProvider={ tabsProvider }
    />, rootElement
  );
}

render();

