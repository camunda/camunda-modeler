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

const { defineConfig } = require('@playwright/test');

const CI = !!process.env.CI;

module.exports = defineConfig({
  testDir: './specs',
  testMatch: '**/*.spec.js',

  // golden export baselines (expected outputs), kept separate from input
  // `fixtures/` and centralized in one directory rather than per-spec folders.
  // Currently a single shared baseline across platforms; if an OS diverges on
  // CI (font rendering differs), append `{-platform}` and generate per-OS.
  snapshotPathTemplate: './__snapshots__/{testFileName}/{arg}{ext}',

  // one Electron instance at a time keeps resource contention predictable;
  // we can shard across workers (each with its own profile) once stable
  workers: 1,
  fullyParallel: false,

  retries: 0,
  timeout: 60000,

  forbidOnly: CI,

  // one shared raster baseline across platforms (see snapshotPathTemplate above);
  // the small ratio absorbs the anti-aliasing / font-rendering jitter between the
  // machine that generated it and the CI runners. SVG is compared exactly.
  expect: {
    toMatchSnapshot: { maxDiffPixelRatio: 0.01 }
  },

  reporter: [
    [ 'list' ],
    [ 'html', { open: 'never', outputFolder: 'playwright-report' } ]
  ],
  outputDir: './test-results',

  // Artifacts (trace/screenshots/video) are driven manually in the harness:
  // the test runner's automatic `use: { trace, ... }` only covers contexts it
  // creates, not the Electron window launched via `_electron.launch`. The
  // `launch` fixture records a full trace and keeps it on failure (or always
  // with E2E_TRACE=1). See test/e2e/README.md.

  projects: [
    {
      name: 'base'
    }

    // the opt-in engine suite (deployment, Local engine connection) is added
    // here later with its own `testMatch` and a c8run globalSetup
  ]
});
