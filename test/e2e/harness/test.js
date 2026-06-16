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

const os = require('os');
const path = require('path');
const fs = require('fs/promises');

const base = require('@playwright/test');

const { launch } = require('./electron-app');

/**
 * The single import seam for specs:
 *
 *   const { test, expect } = require('../harness/test');
 *
 * Provides auto-managed fixtures:
 * - `launch`: launches an app instance and closes it after the test
 * - `tmp`: a per-test temporary directory, removed after the test
 */
const test = base.test.extend({

  // eslint-disable-next-line no-empty-pattern
  launch: async ({}, use, testInfo) => {
    let app;

    const launcher = async (options) => {
      app = await launch(options);

      // capture a full trace, from launch onwards
      await app.startTracing();

      return app;
    };

    await use(launcher);

    if (!app) {
      return;
    }

    // keep the trace on failure, or on demand with E2E_TRACE=1; the trace must
    // be stopped while the app is still alive
    const failed = testInfo.status !== testInfo.expectedStatus;

    if (failed || process.env.E2E_TRACE === '1') {
      const tracePath = testInfo.outputPath('trace.zip');

      await app.stopTracing(tracePath);

      await testInfo.attach('trace', { path: tracePath, contentType: 'application/zip' });
    } else {
      await app.stopTracing();
    }

    await app.close();
  },

  // eslint-disable-next-line no-empty-pattern
  tmp: async ({}, use) => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'cm-e2e-tmp-'));

    await use(dir);

    await fs.rm(dir, { recursive: true, force: true });
  }
});

module.exports = {
  test,
  expect: base.expect
};
