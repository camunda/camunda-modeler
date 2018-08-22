import React from 'react';
import ReactDOM from 'react-dom';

import { AppParent } from './app';

import mitt from 'mitt';

import {
  backend,
  dialog
} from './remote';

const eventBus = mitt();

const globals = {
  backend,
  dialog,
  eventBus
};

const rootElement = document.getElementById('root');
ReactDOM.render(
  <AppParent globals={ globals } />, rootElement
);
