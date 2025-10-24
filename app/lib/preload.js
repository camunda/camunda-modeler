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
  ipcRenderer,
  webUtils
} = require('electron');

const generateId = require('./util/generate-id');

const handledInPreload = [
  'file:get-path'
];

const allowedEvents = [
  ...handledInPreload,
  'app:reload',
  'app:restart',
  'app:quit-aborted',
  'app:quit-allowed',
  'client:error',
  'client:ready',
  'client:templates-update',
  'config:get',
  'config:set',
  'context-menu:open',
  'dialog:open-file-error',
  'dialog:open-file-explorer',
  'dialog:open-files',
  'dialog:save-file',
  'dialog:show',
  'errorTracking:turnedOff',
  'errorTracking:turnedOn',
  'external:open-url',
  'file:read',
  'file:read-stats',
  'file:write',
  'file-context:add-root',
  'file-context:remove-root',
  'file-context:changed',
  'file-context:file-closed',
  'file-context:file-opened',
  'file-context:file-updated',
  'file-context:remove-root',
  'menu:register',
  'menu:update',
  'system-clipboard:write-text',
  'toggle-plugins',
  'workspace:restore',
  'workspace:save',
  'zeebe:checkConnection',
  'zeebe:deploy',
  'zeebe:getGatewayVersion',
  'zeebe:startInstance',
  'zeebe:searchProcessInstances',
  'zeebe:searchElementInstances',
  'zeebe:searchVariables',
  'zeebe:searchIncidents'
];

let executed = false;

contextBridge.exposeInMainWorld('getAppPreload', function() {

  // expose preload only once to prevent exploits
  // related to https://github.com/camunda/camunda-modeler/issues/2143
  if (executed) {
    throw new Error('window#getAppPreload can be accessed only once');
  }

  executed = true;

  return {
    metadata: ipcRenderer.sendSync('app:get-metadata'),
    plugins: ipcRenderer.sendSync('app:get-plugins'),
    flags: ipcRenderer.sendSync('app:get-flags'),
    backend: createBackend(ipcRenderer, process.platform)
  };
});


function createBackend(ipcRenderer, platform) {
  return {
    send,
    on,
    once,
    sendQuitAllowed,
    sendQuitAborted,
    sendReady,
    showContextMenu,
    sendTogglePlugins,
    sendMenuUpdate,
    registerMenu,
    getPlatform
  };

  /**
     * Send a message to the backend, awaiting the answer,
     * resolved as a promise.
     *
     * @param {string} event
     * @param {...any} args
     *
     * @return {Promise<any>|string}
     */
  function send(event, ...args) {
    if (!allowedEvents.includes(event)) {
      throw new Error(`Disallowed event: ${event}`);
    }

    if (handledInPreload.includes(event)) {
      return handleInPreload(event, ...args);
    }

    const id = generateId();

    return new Promise((resolve, reject) => {

      once(event + ':response:' + id, function(evt, args) {
        if (args[0] !== null) {
          reject(args[0]);
        }

        // promises can only resolve with one argument
        return resolve(args[1]);
      });

      ipcRenderer.send(event, id, args);
    });

  }

  /**
   * Subscribe to event.
   *
   * @param {string} event
   * @param {Function} callback
   * @returns {{ cancel: () => void }}
   */
  function on(event, callback) {
    ipcRenderer.on(event, callback);

    return {
      cancel() {
        ipcRenderer.off(event, callback);
      }
    };
  }

  /**
     * Subscribe to event for one call.
     *
     * @param {string} event
     * @param {Function} callback
     * @returns {{ cancel: () => void }}
     */
  function once(event, callback) {
    ipcRenderer.once(event, callback);

    return {
      cancel() {
        ipcRenderer.off(event, callback);
      }
    };
  }

  function sendQuitAllowed() {
    send('app:quit-allowed');
  }

  function sendQuitAborted() {
    send('app:quit-aborted');
  }

  function sendReady() {
    send('client:ready');
  }

  function showContextMenu(type, options) {
    send('context-menu:open', type, options);
  }

  function sendTogglePlugins() {
    send('toggle-plugins');
  }

  function sendMenuUpdate(state = {}) {
    send('menu:update', state);
  }

  function registerMenu(name, options) {
    return send('menu:register', name, options);
  }

  function getPlatform() {
    return platform;
  }
}

function handleInPreload(event, ...args) {
  if (event === 'file:get-path') {
    try {
      const path = webUtils.getPathForFile(args[0]);

      return path || null;
    } catch {
      return null;
    }
  }
}
