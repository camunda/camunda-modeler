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

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const electron = require('electron');

const defineLifecycleSuite = require('../shared/lifecycle-suite');
const { ORIGINAL_CONTENTS, FIXTURE_NAME, SAVED_NAME } = require('../shared/lifecycle-fixture');


/**
 * Electron-backend driver for the shared file-lifecycle parity suite.
 *
 * Spawns a real Electron runtime that drives the open -> edit -> save -> reopen
 * journey across the REAL IPC boundary (real preload + real renderer.js
 * dispatch + real file-system.js), then hands the observations to the shared,
 * backend-agnostic assertions in app/test/e2e/shared/lifecycle-suite.js.
 *
 * A future Rust/Tauri backend reuses that SAME suite via its own driver, so the
 * two backends are held to identical expectations. The renderer (bpmn.io) is
 * unchanged by the migration, so this file lifecycle is the parity-critical
 * journey.
 *
 * Requires a real Electron runtime (xvfb-run on Linux CI). Skipped unless
 * RUN_E2E=true; run via `npm run app:test-e2e`.
 */
defineLifecycleSuite({
  label: 'electron backend',

  async setup() {
    if (process.env.RUN_E2E !== 'true') {
      this.skip();
    }

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-lifecycle-'));

    const fixturePath = path.join(tmpDir, FIXTURE_NAME);
    const savePath = path.join(tmpDir, SAVED_NAME);
    const outPath = path.join(tmpDir, 'report.json');

    fs.writeFileSync(fixturePath, ORIGINAL_CONTENTS);

    await runProbe({
      PROBE_FIXTURE: fixturePath,
      PROBE_SAVE_PATH: savePath,
      PROBE_OUT: outPath
    });

    const report = JSON.parse(fs.readFileSync(outPath, 'utf8'));

    return {
      report,
      savePath,
      readDisk: () => fs.readFileSync(savePath, 'utf8'),
      cleanup: () => fs.rmSync(tmpDir, { recursive: true, force: true })
    };
  }
});


/**
 * Spawn the Electron lifecycle probe and resolve once it reports and exits 0.
 */
function runProbe(env) {
  return new Promise((resolve, reject) => {
    const child = spawn(electron, [ path.resolve(__dirname, 'lifecycle-main.js') ], {
      env: { ...process.env, ...env },
      stdio: [ 'ignore', 'inherit', 'inherit' ]
    });

    child.on('error', reject);

    child.on('exit', (code) => {
      if (code === 0) {
        return resolve();
      }

      reject(new Error(`lifecycle probe exited with code ${code}`));
    });
  });
}
