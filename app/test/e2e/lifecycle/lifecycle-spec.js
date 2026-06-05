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

const ORIGINAL_CONTENTS = '<?xml version="1.0"?>\n<definitions>ORIGINAL</definitions>\n';
const EXPECTED_EDITED_CONTENTS = '<?xml version="1.0"?>\n<definitions>EDITED</definitions>\n';


/**
 * End-to-end smoke test of the file open -> edit -> save -> reopen lifecycle
 * across the REAL Electron IPC boundary (real preload + real renderer.js
 * dispatch + real file-system.js).
 *
 * This is the migration-relevant user journey: the bpmn.io renderer is
 * unchanged by the planned Rust/Tauri migration, so parity hinges on the file
 * lifecycle behaving identically across the IPC boundary. The spec drives the
 * journey through IPC AND independently verifies the file on disk.
 *
 * Requires a real Electron runtime (xvfb-run on Linux CI). Skipped unless
 * RUN_E2E=true; run via `npm run app:test-e2e`.
 */
describe('e2e - file lifecycle (open -> edit -> save -> reopen)', function() {

  this.timeout(40000);

  let tmpDir;
  let savePath;
  let report;

  before(async function() {
    if (process.env.RUN_E2E !== 'true') {
      this.skip();
    }

    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-lifecycle-'));

    const fixturePath = path.join(tmpDir, 'diagram.bpmn');
    const outPath = path.join(tmpDir, 'report.json');

    savePath = path.join(tmpDir, 'diagram.saved.bpmn');

    fs.writeFileSync(fixturePath, ORIGINAL_CONTENTS);

    await runProbe({
      PROBE_FIXTURE: fixturePath,
      PROBE_SAVE_PATH: savePath,
      PROBE_OUT: outPath
    });

    report = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  });

  after(function() {
    if (tmpDir) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });


  describe('open', function() {

    it('should read the original file contents over IPC', function() {
      expect(report.openedContents).to.equal(ORIGINAL_CONTENTS);
    });


    it('should expose the file name', function() {
      expect(report.openedName).to.equal('diagram.bpmn');
    });

  });


  describe('save', function() {

    it('should report the written path and name', function() {
      expect(report.writtenPath).to.equal(savePath);
      expect(report.writtenName).to.equal('diagram.saved.bpmn');
    });


    it('should return a numeric lastModified from write', function() {
      expect(report.writtenLastModifiedType).to.equal('number');
    });


    it('should actually persist the edited contents to disk', function() {

      // independent, out-of-band verification (not via IPC)
      const onDisk = fs.readFileSync(savePath, 'utf8');

      expect(onDisk).to.equal(EXPECTED_EDITED_CONTENTS);
    });

  });


  describe('stats refresh', function() {

    it('should return a numeric lastModified from read-stats', function() {
      expect(report.statsLastModifiedType).to.equal('number');
    });

  });


  describe('reopen', function() {

    it('should read back the edited contents over IPC', function() {
      expect(report.reopenedContents).to.equal(EXPECTED_EDITED_CONTENTS);
    });

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

});
