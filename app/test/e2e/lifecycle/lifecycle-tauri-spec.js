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

const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const defineLifecycleSuite = require('../shared/lifecycle-suite');
const { ORIGINAL_CONTENTS, FIXTURE_NAME, SAVED_NAME } = require('../shared/lifecycle-fixture');

const SRC_TAURI = path.resolve(__dirname, '../../../../src-tauri');
const PROBE_BIN = path.join(SRC_TAURI, 'target', 'debug', 'lifecycle_probe');


/**
 * Tauri/Rust-backend driver for the shared file-lifecycle parity suite.
 *
 * Runs the headless Tauri probe (`src-tauri/app/src/bin/lifecycle_probe.rs`),
 * which drives the SAME shared journey through the real preload shim + Tauri
 * `invoke` + the Rust `modeler-backend` dispatch, then hands the observations to
 * the SAME `defineLifecycleSuite` assertions that judge the Electron backend.
 * Passing both backends through one assertion tree is the structural parity
 * proof the migration safety net is built around.
 *
 * Skipped unless RUN_E2E=true; run via `npm run app:test-e2e`. Requires the
 * Rust toolchain (the probe is built on demand).
 */
defineLifecycleSuite({
  label: 'tauri backend',

  async setup() {
    if (process.env.RUN_E2E !== 'true') {
      this.skip();
    }

    const build = spawnSync('cargo', [ 'build', '--bin', 'lifecycle_probe' ], {
      cwd: SRC_TAURI,
      stdio: 'inherit'
    });

    if (build.status !== 0) {
      throw new Error(`Failed to build the lifecycle_probe (cargo exited ${build.status})`);
    }

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-lifecycle-tauri-'));

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
 * Spawn the Tauri probe and resolve once it reports and exits 0.
 */
function runProbe(env) {
  return new Promise((resolve, reject) => {
    const child = spawn(PROBE_BIN, [], {
      env: { ...process.env, ...env },
      stdio: [ 'ignore', 'inherit', 'inherit' ]
    });

    child.on('error', reject);

    child.on('exit', (code) => {
      if (code === 0) {
        return resolve();
      }

      reject(new Error(`lifecycle_probe exited with code ${code}`));
    });
  });
}
