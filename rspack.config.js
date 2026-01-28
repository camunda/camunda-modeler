/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const path = require('path');

/** @type {import('@rspack/core').Configuration} */
const config = {
  mode: 'production',
  target: 'electron-preload',
  entry: './app/lib/preload.js',
  output: {
    path: path.resolve(__dirname, 'app/preload'),
    filename: 'preload.js'
  },
  resolve: {
    mainFields: [ 'main' ],
  }
};

module.exports = config;
