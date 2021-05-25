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

const NODE_ENV = process.env.NODE_ENV || 'development';
const SENTRY_DSN = process.env.SENTRY_DSN || null;

const pkg = require('./package.json');

const SentryWebpackPlugin = require('@sentry/webpack-plugin');
const { EnvironmentPlugin } = require('webpack');

const baseConfig = {
  mode: NODE_ENV,
  externals: [...Object.keys(pkg.dependencies || {})],
  resolve: {
    modules: [
      'node_modules'
    ]
  },
  plugins: [
    new EnvironmentPlugin({
      NODE_ENV,
      SENTRY_DSN
    }),
    ...sentryIntegration()
  ],

  /**
   * Disables webpack processing of __dirname and __filename.
   * If you run the bundle in node.js it falls back to these values of node.js.
   * https://github.com/webpack/webpack/issues/2010
   */
  node: {
    __dirname: false,
    __filename: false,
  },
  devtool: 'source-map'
};

const mainConfig = {
  ...baseConfig,
  target: 'electron-main',
  entry: path.join(__dirname, 'lib', 'index.js'),
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'prod.bundle.js',

    // https://github.com/webpack/webpack/issues/1114
    libraryTarget: 'commonjs2'
  }
};

const preloadConfig = {
  ...baseConfig,
  target: 'electron-preload',
  entry: path.join(__dirname, 'lib', 'preload.js'),
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'preload.js',

    // https://github.com/webpack/webpack/issues/1114
    libraryTarget: 'commonjs2'
  }
};

module.exports = [
  mainConfig,
  preloadConfig
];


// helpers //////////////////////

function sentryIntegration() {
  if (!SENTRY_DSN) {
    return [];
  }

  const { version } = pkg;

  // necessary SENTRY_AUTH_TOKEN, SENTRY_ORG and SENTRY_PROJECT environment
  // variables are injected via CI when building.
  return [
    new SentryWebpackPlugin({
      release: NODE_ENV === 'production' ? version : 'dev',
      include: '.',
      ignore: ['node_modules', 'webpack.config.js', '-spec.js'],
    })
  ];
}
