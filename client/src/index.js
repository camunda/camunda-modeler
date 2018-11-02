import React from 'react';
import ReactDOM from 'react-dom';

import { AppParent, TabsProvider } from './app';

import {
  backend,
  dialog,
  fileSystem,
  workspace
} from './remote';

const tabsProvider = new TabsProvider();

const globals = {
  backend,
  dialog,
  fileSystem,
  workspace
};

const rootElement = document.getElementById('root');
ReactDOM.render(
  <AppParent
    globals={ globals }
    tabsProvider={ tabsProvider }
  />, rootElement
);
