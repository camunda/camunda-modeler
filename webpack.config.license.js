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
const { IgnorePlugin } = require('webpack');
const { LicenseWebpackPlugin } = require('license-webpack-plugin');

const overrides = require('./tasks/license-book-handlers/license-book-overrides');

/** @type {import('webpack').Configuration} */
const config = {
  mode: 'development',
  devtool: false,
  target: 'electron-main',
  entry: './app/prod.js',
  output: {
    path: path.resolve(__dirname, 'tmp'),
  },
  resolve: {
    mainFields: [ 'main' ],
  },
  plugins: [
    new IgnorePlugin({
      checkResource(resource) {

        // WONTFIX(barmac): ignore C++ modules for now
        // they are added to the license book through optional-dependencies.js
        if (/^vscode-windows-ca-certs/.test(resource)) {
          return true;
        }

        return false;
      }
    }),
    new LicenseWebpackPlugin({
      ...overrides,
      outputFilename: 'dependencies.json',
      perChunkOutput: false,
      excludedPackageTest: (packageName) => {

        // TODO(@philippfromme): workaround for https://github.com/camunda/camunda-modeler/issues/3249
        // cf. https://github.com/xz64/license-webpack-plugin/issues/124
        return packageName === 'camunda-modeler';
      },
      renderLicenses: (modules) => {
        return JSON.stringify(modules, null, 2);
      }
    })
  ]
};

module.exports = config;
