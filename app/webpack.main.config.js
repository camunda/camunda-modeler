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
const { DefinePlugin } = require('webpack');

/** @type {import('webpack').Configuration} */
const config = {
  mode: 'production',
  target: 'electron-main',
  entry: path.resolve(__dirname, 'prod.js'),
  externals: {
    ...replaceOptionalDeps()
  },
  plugins: [
    new DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env.SENTRY_DSN': JSON.stringify(process.env.SENTRY_DSN || '')
    })
  ]
};

/**
 * Replace non-installed optional dependencies with empty objects to prevent Webpack error.
*/
function replaceOptionalDeps() {
  const { optionalDependencies } = require('./package.json');
  const replacements = {};

  if (!optionalDependencies) {
    return {};
  }

  for (const dep in optionalDependencies) {
    try {
      require.resolve(dep);
    } catch (error) {
      replacements[dep] = {};
    }
  }

  return replacements;
}

module.exports = config;
