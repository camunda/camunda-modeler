/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const {
  contextBridge,
  ipcRenderer
} = require('electron');

const allowedEvents = [
  'errorTracking:turnedOn',
  'errorTracking:turnedOff',
  'external:open-url',
  'dialog:open-files',
  'dialog:open-file-error',
  'dialog:save-file',
  'dialog:show',
  'file:read',
  'file:read-stats',
  'file:write',
  'zeebe:checkConnection',
  'zeebe:deploy',
  'zeebe:run',
  'config:get',
  'config:set',
  'toggle-plugins',
  'client:ready',
  'client:error',
  'app:quit-allowed',
  'workspace:restore',
  'workspace:save',
  'menu:register',
  'menu:update',
  'context-menu:open'
];

const api = {
  send: (event, ...args) => {
    if (!allowedEvents.includes(event)) {
      throw new Error(`Disallowed event: ${event}`);
    }

    ipcRenderer.send(event, ...args);
  },
  on: (event, callback) => {
    ipcRenderer.on(event, callback);

    return {
      cancel() {
        ipcRenderer.off(event, callback);
      }
    };
  },
  once: (event, callback) => {
    ipcRenderer.once(event, callback);

    return {
      cancel() {
        ipcRenderer.off(event, callback);
      }
    };
  }
};

let executed = false;

contextBridge.exposeInMainWorld('getAppPreload', function() {

  // expose api only once
  // related to https://github.com/camunda/camunda-modeler/issues/2143
  if (executed) {
    return;
  }

  executed = true;

  return {
    metadata: ipcRenderer.sendSync('app:get-metadata'),
    plugins: ipcRenderer.sendSync('app:get-plugins'),
    flags: ipcRenderer.sendSync('app:get-flags'),
    api,
    platform: process.platform
  };
});
