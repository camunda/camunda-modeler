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
  workspace
} from './remote';

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
  workspace
};

const rootElement = document.getElementById('root');
ReactDOM.render(
  <AppParent
    keyboardBindings={ keyboardBindings }
    globals={ globals }
    tabsProvider={ tabsProvider }
  />, rootElement
);
