/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import './styles/style.less';

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
  flags,
  log,
  metadata,
  workspace,
  zeebeAPI
} from './remote';

import Metadata from './util/Metadata';
import Flags from './util/Flags';

import debug from 'debug';

if (process.env.NODE_ENV !== 'production') {
  debug.enable('*,-sockjs-client:*');
}

Metadata.init(metadata);
Flags.init(flags);


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
  log,
  plugins,
  workspace,
  zeebeAPI
};


async function render() {

  // load plugins
  plugins.bindHelpers(window);

  await plugins.loadAll();

  const rootElement = document.querySelector('#root');

  const onStarted = () => {

    // mark as finished loading
    document.querySelector('body > .spinner-border').classList.add('hidden');
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
