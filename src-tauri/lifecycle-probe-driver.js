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
 * Tauri lifecycle probe driver (browser side).
 *
 * Injected after the preload shim and the shared journey. Builds a `call`
 * transport from the shim's reconstructed `backend.send` (so the shim + Tauri
 * IPC + Rust dispatch are all exercised), runs the shared journey, and reports
 * the observations back to the probe binary.
 */

(function() {

  'use strict';

  function start() {
    try {
      var boot = window.__MODELER_BOOT__ || {};
      var backend = window.getAppPreload().backend;

      function call(event) {
        var args = Array.prototype.slice.call(arguments, 1);

        return backend.send.apply(backend, [ event ].concat(args));
      }

      window.lifecycleJourney.runLifecycleJourney(call, boot.probe).then(function(observations) {
        window.__TAURI__.core.invoke('probe_report', { results: observations });
      }).catch(function(err) {
        window.__TAURI__.core.invoke('probe_error', { message: (err && err.stack) || String(err) });
      });
    } catch (err) {
      window.__TAURI__.core.invoke('probe_error', { message: (err && err.stack) || String(err) });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

})();
