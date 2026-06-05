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

/**
 * Probe preload: loads the REAL application preload (which exposes
 * `window.getAppPreload()` and the genuine `backend` IPC bridge) and adds a
 * small side channel the probe renderer uses to receive the fixture path and
 * report its observations back to main.
 */

const { contextBridge, ipcRenderer } = require('electron');

// Self-registers `window.getAppPreload()` with the real backend protocol.
require('../../../lib/preload');

contextBridge.exposeInMainWorld('probe', {
  onFixture(callback) {
    ipcRenderer.on('probe:fixture', (event, fixturePath) => callback(fixturePath));
  },
  report(results) {
    ipcRenderer.send('probe:report', results);
  },
  reportError(message) {
    ipcRenderer.send('probe:error', message);
  }
});
