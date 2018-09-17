import React from 'react';
import ReactDOM from 'react-dom';

import { AppParent, TabsProvider } from './app';

import mitt from 'mitt';

import {
  backend,
  dialog,
  fileSystem,
  workspace
} from './remote';

const eventBus = mitt();

const tabsProvider = new TabsProvider();

const globals = {
  backend,
  dialog,
  eventBus,
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
