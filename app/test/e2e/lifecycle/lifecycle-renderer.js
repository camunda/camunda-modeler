/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/* eslint-env browser */
/* global window */

'use strict';

/**
 * Electron driver for the shared file-lifecycle journey.
 *
 * Injects the Electron `backend.send` transport into the backend-agnostic
 * journey (app/test/e2e/shared/lifecycle-journey.js). A future Tauri webview
 * would inject its own `invoke`-based transport and reuse the exact same
 * journey and assertions.
 */

(function() {

  const { backend } = window.getAppPreload();

  // contract-event transport over the real Electron IPC bridge
  function call(event, ...args) {
    return backend.send(event, ...args);
  }

  window.probe.onFixture(async (fixture) => {
    try {
      const observations = await window.lifecycleJourney.runLifecycleJourney(call, fixture);

      window.probe.report(observations);
    } catch (err) {
      window.probe.reportError((err && err.stack) || String(err));
    }
  });

})();
