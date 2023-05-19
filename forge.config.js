/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/** @typedef {import('@electron-forge/shared-types').ForgeConfig} ForgeConfig */

/** @type {ForgeConfig} */
const config = {
  packagerConfig: {
    name: 'Camunda Modeler'
  },
  rebuildConfig: {},
  plugins: [
    {
      name: '@electron-forge/plugin-webpack',
      config: {
        mainConfig: './app/webpack.main.config.js',
        renderer: {
          config: './client/webpack.config.js',
          entryPoints: [
            {
              name: 'main_window',
              html: './client/public/index.html',
              js: './client/src/index.js',
              preload: {
                js: './app/preload/preload.js'
              }
            }
          ]
        }
      }
    }
  ],
  makers: [
    {
      name: '@electron-forge/maker-dmg'
    },
    {
      name: '@electron-forge/maker-zip'
    }
  ]
};

module.exports = config;
