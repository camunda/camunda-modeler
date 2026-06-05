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
 * Electron main process for the IPC serialization probe.
 *
 * Boots a hidden window wired with the REAL preload (`app/lib/preload.js`) and
 * the REAL main-side dispatch (`app/lib/util/renderer.js`), then lets the
 * renderer round-trip a battery of values through genuine Electron IPC. The
 * observed shapes are written to PROBE_OUT as JSON.
 *
 * This characterizes the actual structured-clone behavior of Electron IPC -
 * the one thing the Node-only contract suite cannot see - so a future
 * Rust/Tauri backend can be checked for byte-for-byte parity.
 *
 * Faithfulness note: production uses `sandbox: true` with a webpacked preload;
 * here we use `sandbox: false` so the source preload/renderer modules load
 * directly. Structured-clone serialization is independent of the sandbox flag.
 */

const path = require('path');
const fs = require('fs');

const { app, ipcMain, BrowserWindow } = require('electron');

const renderer = require('../../../lib/util/renderer');
const { readFile, readFileStats, writeFile } = require('../../../lib/file-system');

const { describeValue } = require('./describe-value');

const PROBE_OUT = process.env.PROBE_OUT;
const PROBE_FIXTURE = process.env.PROBE_FIXTURE;

app.disableHardwareAcceleration();

// --- sync handlers the real preload calls eagerly on getAppPreload() --------
ipcMain.on('app:get-metadata', (event) => {
  event.returnValue = { version: '0.0.0', name: 'Camunda Modeler' };
});
ipcMain.on('app:get-plugins', (event) => {
  event.returnValue = [];
});
ipcMain.on('app:get-flags', (event) => {
  event.returnValue = {};
});

// --- real request/response handlers (mirrors index.js wiring) ---------------
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

// `config:get` returns a crafted object so we can observe how main -> renderer
// serialization treats undefined / Date / null / nested binary / sparse arrays.
renderer.on('config:get', function(key, ...args) {
  const done = args.pop();

  done(null, {
    aString: 'text',
    aNumber: 42,
    aNull: null,
    anUndefined: undefined,
    aDate: new Date('2020-01-02T03:04:05.000Z'),
    aBuffer: Buffer.from([ 1, 2, 3 ]),
    nested: { inner: [ 1, undefined, 3 ] }
  });
});

// `config:set` describes what MAIN received, characterizing renderer -> main
// serialization of the same hard-to-serialize values.
renderer.on('config:set', function(key, value, ...args) {
  const done = args.pop();

  done(null, describeValue(value));
});

// --- report channel ---------------------------------------------------------
ipcMain.on('probe:report', (event, results) => {
  try {
    fs.writeFileSync(PROBE_OUT, JSON.stringify(results, null, 2));
    app.exit(0);
  } catch (err) {
    process.stderr.write(`probe: failed to write report: ${err.stack}\n`);
    app.exit(1);
  }
});

ipcMain.on('probe:error', (event, message) => {
  process.stderr.write(`probe: renderer error: ${message}\n`);
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

  // `renderer.send` (push) targets app.mainWindow; set it for completeness.
  app.mainWindow = window;

  window.webContents.on('did-finish-load', () => {
    window.webContents.send('probe:fixture', PROBE_FIXTURE);
  });

  window.loadFile(path.resolve(__dirname, 'probe-renderer.html'));
});

// Safety net: never hang CI.
setTimeout(() => {
  process.stderr.write('probe: timed out\n');
  app.exit(2);
}, 20000);
