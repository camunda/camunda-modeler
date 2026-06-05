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

/* eslint-disable mocha/no-exports -- shared, backend-agnostic suite factory reused by each backend's driver spec */

const {
  ORIGINAL_CONTENTS,
  EXPECTED_EDITED_CONTENTS,
  FIXTURE_NAME,
  SAVED_NAME
} = require('./lifecycle-fixture');

/**
 * Backend-agnostic file-lifecycle parity suite.
 *
 * Registers the SAME open -> edit -> save -> reopen assertions regardless of
 * which backend produced the observations. Each backend supplies a `setup()`
 * that drives the shared journey through its own IPC transport and returns a
 * normalized context:
 *
 *   {
 *     report,            // observations reported by the renderer journey
 *     savePath,          // absolute path the renderer saved to
 *     readDisk(): string,// out-of-band read of savePath (NOT via IPC)
 *     cleanup?(): void   // optional teardown
 *   }
 *
 * `setup` runs as a mocha `before` hook (so it may call `this.skip()`); it may
 * be async. Because the current Electron backend and a future Rust/Tauri
 * backend are judged by this identical assertion tree, parity is structurally
 * enforced rather than trusted to a manual port.
 *
 * @param {Object} options
 * @param {string} options.label - Human-readable backend label.
 * @param {Function} options.setup - Returns (or resolves to) the context.
 */
module.exports = function defineLifecycleSuite({ label, setup }) {

  describe(`e2e - file lifecycle parity (${label})`, function() {

    this.timeout(40000);

    let ctx;

    before(async function() {
      ctx = await setup.call(this);
    });

    after(async function() {
      if (ctx && ctx.cleanup) {
        await ctx.cleanup();
      }
    });


    describe('open', function() {

      it('should read the original file contents over IPC', function() {
        expect(ctx.report.openedContents).to.equal(ORIGINAL_CONTENTS);
      });


      it('should expose the file name', function() {
        expect(ctx.report.openedName).to.equal(FIXTURE_NAME);
      });

    });


    describe('save', function() {

      it('should report the written path and name', function() {
        expect(ctx.report.writtenPath).to.equal(ctx.savePath);
        expect(ctx.report.writtenName).to.equal(SAVED_NAME);
      });


      it('should return a numeric lastModified from write', function() {
        expect(ctx.report.writtenLastModifiedType).to.equal('number');
      });


      it('should actually persist the edited contents to disk', function() {

        // independent, out-of-band verification (not via IPC)
        expect(ctx.readDisk()).to.equal(EXPECTED_EDITED_CONTENTS);
      });

    });


    describe('stats refresh', function() {

      it('should return a numeric lastModified from read-stats', function() {
        expect(ctx.report.statsLastModifiedType).to.equal('number');
      });

    });


    describe('reopen', function() {

      it('should read back the edited contents over IPC', function() {
        expect(ctx.report.reopenedContents).to.equal(EXPECTED_EDITED_CONTENTS);
      });

    });

  });
};
