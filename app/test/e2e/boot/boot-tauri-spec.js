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

const { expect } = require('chai');

const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const SRC_TAURI = path.resolve(__dirname, '../../../../src-tauri');
const PROBE_BIN = path.join(SRC_TAURI, 'target', 'debug', 'boot_probe');
const CLIENT_BUNDLE = path.resolve(__dirname, '../../../public/index.html');


/**
 * Real-renderer boot smoke test for the Tauri/Rust backend.
 *
 * Boots the UNCHANGED bpmn.io renderer (`app/public`) under the Tauri shell +
 * preload shim via the headless `boot_probe` and asserts it reaches its ready
 * state (`client:ready`) without raising an uncaught error. This proves the
 * renderer the real users see actually comes up on the new backend — the
 * complement to the lifecycle parity oracle, which proves backend behavior.
 *
 * Skipped unless RUN_E2E=true; run via `npm run app:test-e2e`. Requires the
 * Rust toolchain (the probe is built on demand) and a built client bundle
 * (`npm run client:build`).
 */
describe('tauri backend - real renderer boot', function() {

  // generous: first run may build the client bundle + the Rust probe
  this.timeout(180000);

  let report, tmpDir;

  before(async function() {
    if (process.env.RUN_E2E !== 'true') {
      this.skip();
    }

    if (!fs.existsSync(CLIENT_BUNDLE)) {
      const clientBuild = spawnSync('npm', [ 'run', 'client:build' ], {
        cwd: path.resolve(__dirname, '../../../..'),
        stdio: 'inherit'
      });

      if (clientBuild.status !== 0) {
        throw new Error(`Failed to build the client bundle (npm exited ${clientBuild.status})`);
      }
    }

    const build = spawnSync('cargo', [ 'build', '--bin', 'boot_probe' ], {
      cwd: SRC_TAURI,
      stdio: 'inherit'
    });

    if (build.status !== 0) {
      throw new Error(`Failed to build the boot_probe (cargo exited ${build.status})`);
    }

    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-boot-tauri-'));

    const outPath = path.join(tmpDir, 'report.json');

    await runProbe({ PROBE_OUT: outPath });

    report = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  });

  after(function() {
    if (tmpDir) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });


  it('should boot the renderer to its ready state', function() {
    expect(report.booted).to.be.true;
  });


  it('should boot without uncaught renderer errors', function() {
    expect(report.errors).to.eql([]);
  });


  it('should reach client:ready', function() {
    expect(report.events).to.include('client:ready');
  });


  it('should complete the client:started round-trip', function() {

    // the backend emits client:started in response to client:ready; the probe
    // only records it once the renderer actually receives it back, proving the
    // app leaves its loading state
    const readyIndex = report.events.indexOf('client:ready');
    const startedIndex = report.events.indexOf('client:started');

    expect(startedIndex).to.be.greaterThan(readyIndex);
  });


  it('should read its config and restore the workspace during boot', function() {

    // the renderer only sends client:ready after restoring the workspace, so
    // these must have been observed before it
    const readyIndex = report.events.indexOf('client:ready');

    expect(report.events.slice(0, readyIndex)).to.include('config:get');
    expect(report.events.slice(0, readyIndex)).to.include('workspace:restore');
  });

});


/**
 * Spawn the Tauri boot probe and resolve once it reports a successful boot
 * (exit 0). Non-zero exit codes are surfaced as failures.
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

      reject(new Error(`boot_probe exited with code ${code} (renderer failed to boot)`));
    });
  });
}
