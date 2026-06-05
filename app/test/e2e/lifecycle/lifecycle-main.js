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
 * Electron main process for the file open -> edit -> save -> reopen lifecycle
 * smoke test.
 *
 * Boots a hidden window wired with the REAL preload and the REAL main-side
 * filesystem handlers (mirroring index.js), then lets the renderer drive the
 * full open/edit/save/reopen journey through genuine Electron IPC. Observations
 * are written to PROBE_OUT; the spec independently verifies the file on disk.
 *
 * This is the migration-relevant E2E flow: the renderer (bpmn.io) is unchanged
 * by the planned Rust/Tauri migration, so the smoke test targets the file
 * lifecycle across the IPC boundary - exactly what a parity backend replaces.
 */

const path = require('path');
const fs = require('fs');

const { app, ipcMain, BrowserWindow } = require('electron');

const renderer = require('../../../lib/util/renderer');
const { readFile, readFileStats, writeFile } = require('../../../lib/file-system');
const { MARKER_FROM, MARKER_TO } = require('../shared/lifecycle-fixture');

const PROBE_OUT = process.env.PROBE_OUT;
const PROBE_FIXTURE = process.env.PROBE_FIXTURE;
const PROBE_SAVE_PATH = process.env.PROBE_SAVE_PATH;

app.disableHardwareAcceleration();

// sync handlers the real preload calls eagerly on getAppPreload()
ipcMain.on('app:get-metadata', (event) => {
  event.returnValue = { version: '0.0.0', name: 'Camunda Modeler' };
});
ipcMain.on('app:get-plugins', (event) => {
  event.returnValue = [];
});
ipcMain.on('app:get-flags', (event) => {
  event.returnValue = {};
});

// real filesystem handlers (mirrors index.js wiring)
renderer.on('file:read', function(filePath, options = {}, done) {
  try {
    done(null, readFile(filePath, options));
  } catch (err) {
    done(err);
  }
});

renderer.on('file:read-stats', function(file, done) {
  done(null, readFileStats(file));
});

renderer.on('file:write', function(filePath, file, options = {}, done) {
  try {
    done(null, writeFile(filePath, file, options));
  } catch (err) {
    done(err);
  }
});

ipcMain.on('probe:report', (event, results) => {
  try {
    fs.writeFileSync(PROBE_OUT, JSON.stringify(results, null, 2));
    app.exit(0);
  } catch (err) {
    process.stderr.write(`lifecycle: failed to write report: ${err.stack}\n`);
    app.exit(1);
  }
});

ipcMain.on('probe:error', (event, message) => {
  process.stderr.write(`lifecycle: renderer error: ${message}\n`);
  app.exit(1);
});

app.whenReady().then(() => {
  const window = new BrowserWindow({
    show: false,
    webPreferences: {
      preload: path.resolve(__dirname, '../shared/probe-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  app.mainWindow = window;

  window.webContents.on('did-finish-load', () => {
    window.webContents.send('probe:fixture', {
      fixturePath: PROBE_FIXTURE,
      savePath: PROBE_SAVE_PATH,
      markerFrom: MARKER_FROM,
      markerTo: MARKER_TO
    });
  });

  window.loadFile(path.resolve(__dirname, 'lifecycle-renderer.html'));
});

setTimeout(() => {
  process.stderr.write('lifecycle: timed out\n');
  app.exit(2);
}, 20000);
