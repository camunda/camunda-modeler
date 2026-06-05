/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/* eslint-disable */

/**
 * Tauri preload-compat shim.
 *
 * Injected (as a Tauri initialization script) BEFORE the unchanged bpmn.io
 * renderer loads, this reconstructs the exact `window.getAppPreload()` /
 * `backend` API the renderer used under Electron (`app/lib/preload.js`), but
 * implemented over Tauri `invoke` + events.
 *
 * It also bridges the serialization gaps the real-Electron oracle found
 * (`app/test/e2e/serialization`): Electron structured-clone preserves
 * `Uint8Array` and `Date`, whereas Tauri IPC is JSON. We carry those across as
 * tagged values and revive them on each side so binary deploy/import and any
 * Date payloads keep working.
 */

(function() {

  'use strict';

  var UINT8_TYPE = 'Uint8Array';
  var DATE_TYPE = 'Date';

  // mirrors app/lib/preload.js
  var HANDLED_IN_PRELOAD = [ 'file:get-path' ];

  var ALLOWED_EVENTS = HANDLED_IN_PRELOAD.concat([
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
    'zeebe:searchIncidents',
    'zeebe:searchJobs',
    'zeebe:searchMessageSubscriptions',
    'zeebe:searchUserTasks'
  ]);

  var boot = window.__MODELER_BOOT__ || { metadata: {}, plugins: [], flags: {}, platform: 'linux' };

  function tauri() {
    if (!window.__TAURI__) {
      throw new Error('Tauri global bridge unavailable (set app.withGlobalTauri = true)');
    }

    return window.__TAURI__;
  }

  // base64 <-> bytes (browser-safe) ////////

  function bytesToBase64(bytes) {
    var binary = '';

    for (var i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }

    return window.btoa(binary);
  }

  function base64ToBytes(base64) {
    var binary = window.atob(base64);
    var bytes = new Uint8Array(binary.length);

    for (var i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
  }

  // tagged-value codec ////////

  /**
   * Encode outgoing values so Tauri's JSON IPC keeps the types Electron's
   * structured clone preserved (Uint8Array, Date).
   */
  function encode(value) {
    if (value instanceof Uint8Array) {
      return { __type: UINT8_TYPE, data: bytesToBase64(value) };
    }

    if (value instanceof ArrayBuffer) {
      return { __type: UINT8_TYPE, data: bytesToBase64(new Uint8Array(value)) };
    }

    if (value instanceof Date) {
      return { __type: DATE_TYPE, value: value.getTime() };
    }

    if (Array.isArray(value)) {
      return value.map(encode);
    }

    if (value && typeof value === 'object') {
      var out = {};

      for (var key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          out[key] = encode(value[key]);
        }
      }

      return out;
    }

    return value;
  }

  /**
   * Revive tagged values coming back from the backend into the real JS types
   * the renderer expects.
   */
  function revive(value) {
    if (Array.isArray(value)) {
      return value.map(revive);
    }

    if (value && typeof value === 'object') {
      if (value.__type === UINT8_TYPE && typeof value.data === 'string') {
        return base64ToBytes(value.data);
      }

      if (value.__type === DATE_TYPE && typeof value.value === 'number') {
        return new Date(value.value);
      }

      var out = {};

      for (var key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          out[key] = revive(value[key]);
        }
      }

      return out;
    }

    return value;
  }

  // backend ////////

  function createBackend() {
    return {
      send: send,
      on: on,
      once: once,
      sendQuitAllowed: sendQuitAllowed,
      sendQuitAborted: sendQuitAborted,
      sendReady: sendReady,
      showContextMenu: showContextMenu,
      sendTogglePlugins: sendTogglePlugins,
      sendMenuUpdate: sendMenuUpdate,
      registerMenu: registerMenu,
      getPlatform: getPlatform
    };

    /**
     * Send a message to the backend, awaiting the answer as a Promise.
     * Mirrors `backend.send` in app/lib/preload.js.
     */
    function send(event) {
      var args = Array.prototype.slice.call(arguments, 1);

      if (ALLOWED_EVENTS.indexOf(event) === -1) {
        throw new Error('Disallowed event: ' + event);
      }

      if (HANDLED_IN_PRELOAD.indexOf(event) !== -1) {
        return handleInPreload(event, args);
      }

      return tauri().core.invoke('ipc_dispatch', {
        event: event,
        args: args.map(encode)
      }).then(revive);
    }

    /**
     * Subscribe to a main->renderer push event. Adapts the Tauri single-payload
     * delivery back to the Electron `(event, ...args)` callback signature and
     * returns a synchronous `{ cancel }` even though Tauri unlisten is async.
     */
    function on(event, callback) {
      return subscribe(event, callback, false);
    }

    function once(event, callback) {
      return subscribe(event, callback, true);
    }

    function subscribe(event, callback, isOnce) {
      var cancelled = false;
      var unlisten = null;

      var method = isOnce ? 'once' : 'listen';

      tauri().event[method](event, function(tauriEvent) {
        var payload = tauriEvent && tauriEvent.payload;
        var args = Array.isArray(payload) ? payload : [ payload ];

        // emulate Electron's leading IpcRendererEvent argument
        callback.apply(null, [ tauriEvent ].concat(args.map(revive)));
      }).then(function(fn) {
        unlisten = fn;

        if (cancelled) {
          unlisten();
        }
      });

      return {
        cancel: function() {
          cancelled = true;

          if (unlisten) {
            unlisten();
          }
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

    function sendMenuUpdate(state) {
      send('menu:update', state || {});
    }

    function registerMenu(name, options) {
      return send('menu:register', name, options);
    }

    function getPlatform() {
      return boot.platform;
    }
  }

  function handleInPreload(event, args) {

    // `file:get-path` relied on Electron webUtils.getPathForFile; there is no
    // portable web equivalent. Tracked for the drag-and-drop migration phase.
    if (event === 'file:get-path') {
      return null;
    }
  }

  // getAppPreload (single-use, like Electron) ////////

  var executed = false;

  window.getAppPreload = function() {
    if (executed) {
      throw new Error('window#getAppPreload can be accessed only once');
    }

    executed = true;

    return {
      metadata: boot.metadata,
      plugins: boot.plugins,
      flags: boot.flags,
      backend: createBackend()
    };
  };

})();
