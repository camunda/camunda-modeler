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

import { flags, globals, metadata, plugins } from './globals';

import React from 'react';
import ReactDOM from 'react-dom';

import { AppParent, KeyboardBindings, TabsProvider } from './app';

import Metadata from './util/Metadata';
import Flags from './util/Flags';

import debug from 'debug';
import { migrateConnections } from './app/migrations/migrateConnections';

// This fix is necessary because dragular expects `global` to be defined, see
// https://github.com/bevacqua/dragula/issues/602 for context
window.global = window;

if (process.env.NODE_ENV !== 'production') {
  debug.enable('*,-sockjs-client:*');
}

Metadata.init(metadata);
Flags.init(flags);

const keyboardBindings = new KeyboardBindings({
  isMac: globals.isMac,
});

async function render() {
  if (process.env.NODE_ENV !== 'production') {
    const { loadA11yHelper } = await import('./util/a11y');
    await loadA11yHelper();
  }

  // load plugins
  plugins.bindHelpers(window);

  await plugins.loadAll();

  const rootElement = document.querySelector('#root');

  const onStarted = () => {

    // mark as finished loading
    document.querySelector('body > .spinner-border').classList.add('hidden');

    migrateConnections(globals.settings, globals.config);
  };

  const tabsProvider = new TabsProvider(plugins.get('tabs'), globals.settings);

  ReactDOM.render(
    <AppParent
      keyboardBindings={ keyboardBindings }
      globals={ globals }
      tabsProvider={ tabsProvider }
      onStarted={ onStarted }
    />,
    rootElement,
  );
}

render();
