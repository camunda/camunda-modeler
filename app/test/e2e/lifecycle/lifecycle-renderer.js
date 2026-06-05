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
 * Drives the open -> edit -> save -> reopen journey through the REAL `backend`
 * IPC bridge, the way a tab does in the actual application: read a file, edit
 * its contents in memory, write it back, refresh its stats, and reopen it.
 *
 * The results are reported to main; the spec additionally verifies the file on
 * disk so the assertion is genuinely end-to-end.
 */

(function() {

  const MARKER_FROM = 'ORIGINAL';
  const MARKER_TO = 'EDITED';

  async function run(backend, fixturePath, savePath) {
    const observations = {};

    // open
    const opened = await backend.send('file:read', fixturePath, { encoding: 'utf8' });
    observations.openedContents = opened.contents;
    observations.openedName = opened.name;

    // edit (in memory, as the editor would)
    const editedContents = opened.contents.replace(MARKER_FROM, MARKER_TO);

    // save to a new path (Save As ...)
    const written = await backend.send('file:write', savePath, {
      ...opened,
      contents: editedContents,
      path: savePath
    }, {});

    observations.writtenPath = written.path;
    observations.writtenName = written.name;
    observations.writtenLastModifiedType = typeof written.lastModified;

    // refresh stats (as the app does after save)
    const stats = await backend.send('file:read-stats', written);
    observations.statsLastModifiedType = typeof stats.lastModified;

    // reopen from disk and confirm the edit persisted
    const reopened = await backend.send('file:read', savePath, { encoding: 'utf8' });
    observations.reopenedContents = reopened.contents;

    return observations;
  }

  try {
    const { backend } = window.getAppPreload();

    window.probe.onFixture(async ({ fixturePath, savePath }) => {
      try {
        const observations = await run(backend, fixturePath, savePath);
        window.probe.report(observations);
      } catch (err) {
        window.probe.reportError((err && err.stack) || String(err));
      }
    });
  } catch (err) {
    window.probe.reportError((err && err.stack) || String(err));
  }

})();
