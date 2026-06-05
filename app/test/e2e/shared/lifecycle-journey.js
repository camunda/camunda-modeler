/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/* global window */

'use strict';

/**
 * Backend-agnostic file-lifecycle journey: open -> edit -> save -> reopen.
 *
 * The transport is INJECTED as `call(event, ...args) => Promise`, so the same
 * journey runs against any backend that honours the IPC contract. The Electron
 * driver injects `backend.send`; a future Tauri webview injects its own
 * `invoke`-based transport. The event names are the contract identifiers
 * defined in app/lib/__tests__/ipc-contract/contract.js.
 *
 * Loadable both as a browser global (`window.lifecycleJourney`) via a <script>
 * tag and as a CommonJS module, so renderers and tooling share one definition.
 */

(function(root) {

  async function runLifecycleJourney(call, fixture) {
    const { fixturePath, savePath, markerFrom, markerTo } = fixture;

    const observations = {};

    // open
    const opened = await call('file:read', fixturePath, { encoding: 'utf8' });

    observations.openedContents = opened.contents;
    observations.openedName = opened.name;

    // edit (in memory, as the editor would)
    const editedContents = opened.contents.replace(markerFrom, markerTo);

    // save to a new path (Save As ...)
    const written = await call('file:write', savePath, {
      ...opened,
      contents: editedContents,
      path: savePath
    }, {});

    observations.writtenPath = written.path;
    observations.writtenName = written.name;
    observations.writtenLastModifiedType = typeof written.lastModified;

    // refresh stats (as the app does after save)
    const stats = await call('file:read-stats', written);

    observations.statsLastModifiedType = typeof stats.lastModified;

    // reopen from disk and confirm the edit persisted
    const reopened = await call('file:read', savePath, { encoding: 'utf8' });

    observations.reopenedContents = reopened.contents;

    return observations;
  }

  const api = { runLifecycleJourney };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  root.lifecycleJourney = api;

})(typeof window !== 'undefined' ? window : globalThis);
