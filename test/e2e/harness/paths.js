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

const path = require('path');

// the `app` workspace directory; its package.json `main` (prod.js) is the
// Electron entry point Playwright launches. Requires `app/public` to be built.
const APP_DIR = path.resolve(__dirname, '../../../app');

// shared fixture diagrams
const FIXTURES_DIR = path.resolve(__dirname, '../fixtures');

/**
 * Absolute path to a fixture file.
 *
 * @param {string} name
 *
 * @return {string}
 */
function fixture(name) {
  return path.join(FIXTURES_DIR, name);
}

module.exports = {
  APP_DIR,
  FIXTURES_DIR,
  fixture
};
