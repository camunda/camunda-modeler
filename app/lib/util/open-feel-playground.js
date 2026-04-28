/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

'use strict';

const electron = require('electron');
const path = require('path');

const { BrowserWindow, session } = electron;

let playgroundWindow = null;

async function openFeelPlayground() {
  if (playgroundWindow && !playgroundWindow.isDestroyed()) {
    playgroundWindow.focus();
    return playgroundWindow;
  }

  playgroundWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'FEEL Playground',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    }
  });

  // Clear cached service workers before loading so the old SW doesn't intercept
  await session.defaultSession.clearStorageData({ storages: [ 'serviceworkers', 'cachestorage' ] });

  playgroundWindow.loadFile(path.join(__dirname, '..', '..', 'feel-playground', 'index.html'));

  playgroundWindow.once('ready-to-show', () => {
    playgroundWindow.show();
  });

  playgroundWindow.on('closed', () => {
    playgroundWindow = null;
  });

  return playgroundWindow;
}

module.exports = { openFeelPlayground };
