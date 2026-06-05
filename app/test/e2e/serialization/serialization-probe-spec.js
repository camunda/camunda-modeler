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

const FIXTURE_BYTES = Buffer.from('<?xml version="1.0"?>\n<definitions>héllo</definitions>\n');


/**
 * End-to-end characterization of REAL Electron IPC structured-clone
 * serialization, observed through the genuine preload `backend` bridge and the
 * real `app/lib/util/renderer.js` dispatch.
 *
 * This is the one part of the IPC contract the Node-only contract suite
 * (app/lib/__tests__/ipc-contract) cannot see. The invariants asserted here are
 * the cross-language oracle a future Rust/Tauri backend must reproduce, because
 * the unchanged renderer depends on them.
 *
 * Requires a real Electron runtime (and, on Linux CI, a virtual display, e.g.
 * `xvfb-run`). Skipped unless RUN_E2E=true so the default `npm run app:test`
 * stays green in headless environments. Run via `npm run app:test-e2e`.
 */
describe('e2e - IPC serialization', function() {

  this.timeout(40000);

  let tmpDir;
  let report;

  before(async function() {
    if (process.env.RUN_E2E !== 'true') {
      this.skip();
    }

    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-ipc-probe-'));

    const fixturePath = path.join(tmpDir, 'fixture.bpmn');
    const outPath = path.join(tmpDir, 'report.json');

    fs.writeFileSync(fixturePath, FIXTURE_BYTES);

    await runProbe({
      PROBE_FIXTURE: fixturePath,
      PROBE_OUT: outPath
    });

    report = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  });

  after(function() {
    if (tmpDir) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });


  describe('main -> renderer', function() {

    it('should deliver utf8 file contents as a string', function() {
      expect(report.readUtf8Contents.type).to.equal('string');
    });


    it('should deliver binary file contents as a Uint8Array (NOT a Buffer object)', function() {

      // A JSON-based backend would send { type: 'Buffer', data: [...] }; Electron
      // structured clone delivers a Uint8Array. A parity backend must match.
      expect(report.readBinaryContents.type).to.equal('uint8array');
      expect(report.readBinaryContents.bytes).to.eql([ ...FIXTURE_BYTES ]);
    });


    it('should deliver lastModified as a number', function() {
      expect(report.lastModified.type).to.equal('number');
    });


    it('should preserve undefined object members (NOT drop them like JSON)', function() {
      expect(report.mainToRenderer.values.anUndefined.type).to.equal('undefined');
    });


    it('should preserve undefined array holes', function() {
      const inner = report.mainToRenderer.values.nested.values.inner;

      expect(inner.type).to.equal('array');
      expect(inner.length).to.equal(3);
      expect(inner.items[1].type).to.equal('undefined');
    });


    it('should preserve Date as a Date instance', function() {
      expect(report.mainToRenderer.values.aDate.type).to.equal('date');
      expect(report.mainToRenderer.values.aDate.iso).to.equal('2020-01-02T03:04:05.000Z');
    });


    it('should deliver Buffer members as Uint8Array', function() {
      expect(report.mainToRenderer.values.aBuffer.type).to.equal('uint8array');
      expect(report.mainToRenderer.values.aBuffer.bytes).to.eql([ 1, 2, 3 ]);
    });


    it('should preserve null', function() {
      expect(report.mainToRenderer.values.aNull.type).to.equal('null');
    });

  });


  describe('error envelope', function() {

    it('should deliver a rejected Error as a plain object (not an Error instance)', function() {
      expect(report.readError.type).to.equal('object');
    });


    it('should expose message and code on the serialized error', function() {
      expect(report.readError.message).to.contain('ENOENT');
      expect(report.readError.code).to.equal('ENOENT');
      expect(report.readError.keys).to.include('message');
      expect(report.readError.keys).to.include('code');
    });


    it('should carry the underlying fs error enumerable props', function() {

      // Documents that extra enumerable props ride along (errno/path/syscall),
      // beyond the forced message/code from renderer.js.
      expect(report.readError.keys).to.include('errno');
      expect(report.readError.keys).to.include('syscall');
    });

  });


  describe('renderer -> main', function() {

    it('should preserve undefined members sent from the renderer', function() {
      expect(report.rendererToMain.values.anUndefined.type).to.equal('undefined');
    });


    it('should round-trip Uint8Array to main as a Uint8Array', function() {
      expect(report.rendererToMain.values.aUint8Array.type).to.equal('uint8array');
      expect(report.rendererToMain.values.aUint8Array.bytes).to.eql([ 1, 2, 3 ]);
    });


    it('should preserve Date sent from the renderer', function() {
      expect(report.rendererToMain.values.aDate.type).to.equal('date');
    });

  });


  /**
   * Spawn the Electron probe and resolve once it writes its report and exits 0.
   */
  function runProbe(env) {
    return new Promise((resolve, reject) => {
      const child = spawn(electron, [ path.resolve(__dirname, 'probe-main.js') ], {
        env: { ...process.env, ...env },
        stdio: [ 'ignore', 'inherit', 'inherit' ]
      });

      child.on('error', reject);

      child.on('exit', (code) => {
        if (code === 0) {
          return resolve();
        }

        reject(new Error(`probe exited with code ${code}`));
      });
    });
  }

});
