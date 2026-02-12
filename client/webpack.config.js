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
const MIXPANEL_TOKEN = process.env.MIXPANEL_TOKEN || null;
const MIXPANEL_STAGE = process.env.MIXPANEL_STAGE || null;

const DEV = NODE_ENV === 'development';
const LICENSE_CHECK = process.env.LICENSE_CHECK;

const UPDATES_SERVER_PRODUCT_NAME = process.env.UPDATES_SERVER_PRODUCT_NAME || 'Camunda Modeler';

const getVersion = require('../app/util/get-version');

const licenseBookOverrides = require('../tasks/license-book-handlers/license-book-overrides');

const {
  DefinePlugin
} = require('webpack');

const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { sentryWebpackPlugin } = require('@sentry/webpack-plugin');

const { LicenseWebpackPlugin } = require('license-webpack-plugin');

const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

const resourcePath = path.resolve(__dirname + '/resources');


const copyPattern = {
  from: './public'
};

if (DEV) {
  copyPattern.transform = applyDevCSP;
}

module.exports = {
  mode: DEV ? 'development' : (LICENSE_CHECK ? 'none' : 'production'),
  target: 'web',
  entry: {
    bundle: [ './src/index.js' ]
  },
  output: {
    path: __dirname + '/build',
    assetModuleFilename: 'static/media/[name].[hash:8][ext]'
  },
  resolve: {
    mainFields: DEV ? [ 'browser', 'dev:module', 'module', 'main' ] : [ 'browser', 'module', 'main' ],
    modules: [
      'node_modules',
      resourcePath
    ],
    alias: {
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom')
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      },

      // apply loaders, falling back to file-loader, if non matches
      {
        oneOf: [
          {
            test: /[/\\][A-Z][^/\\]+\.svg$/,
            use: 'react-svg-loader'
          },
          {
            test: /\.(bpmn|dmn|form|rpa)$/,
            type: 'asset/source'
          },
          {
            test: /\.css$/,
            use: [
              'style-loader',
              cssLoader()
            ]
          },
          {
            test: /\.less$/,
            use: [
              'style-loader',
              cssLoader(),
              'less-loader'
            ]
          },
          {

            // exclude files served otherwise
            exclude: [ /\.(js|jsx|cjs|mjs|bpmnlintrc)$/, /\.html$/, /\.json$/ ],
            type: 'asset/resource'
          }
        ]
      }
    ]
  },
  plugins: [
    new CaseSensitivePathsPlugin(),
    new DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
      'process.env.SENTRY_DSN': JSON.stringify(SENTRY_DSN),
      'process.env.UPDATES_SERVER_PRODUCT_NAME': JSON.stringify(UPDATES_SERVER_PRODUCT_NAME),
      'process.env.MIXPANEL_TOKEN': JSON.stringify(MIXPANEL_TOKEN),
      'process.env.MIXPANEL_STAGE': JSON.stringify(MIXPANEL_STAGE),
    }),
    new CopyWebpackPlugin({
      patterns: [ copyPattern ]
    }),
    new MonacoWebpackPlugin(),
    ...sentryIntegration(),
    ...extractDependencies()
  ],

  // don't bundle shims for node globals
  node: false,
  devServer: {
    writeToDisk: true
  },
  devtool: DEV ? 'eval-source-map' : 'source-map'
};



// helpers //////////////////////

function sentryIntegration() {
  if (!SENTRY_DSN) {
    return [];
  }

  const version = getVersion();

  return [
    sentryWebpackPlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      release: {
        name: version
      }
    })
  ];
}

function cssLoader() {

  if (DEV) {
    return {
      loader: 'css-loader',
      options: {
        modules: {
          localIdentName: '[path][name]__[local]--[hash:base64:5]',
          mode: 'global'
        }
      }
    };
  } else {
    return {
      loader: 'css-loader',
      options: {
        modules: 'global'
      }
    };
  }
}


function extractDependencies() {

  if (!LICENSE_CHECK) {
    return [];
  }

  return [
    new LicenseWebpackPlugin({
      ...licenseBookOverrides,
      outputFilename: 'dependencies.json',
      perChunkOutput: false,
      excludedPackageTest: (packageName) => {

        // TODO(@philippfromme): workaround for https://github.com/camunda/camunda-modeler/issues/3249
        // cf. https://github.com/xz64/license-webpack-plugin/issues/124
        return packageName === 'camunda-modeler-client';
      },
      renderLicenses: (modules) => {
        return JSON.stringify(modules, null, 2);
      }
    })
  ];
}

/**
 * Patch index.html CSP directive to make sure we can use
 * unsafe-eval in development mode. It is the fastest way
 * to get per module source maps.
 */
function applyDevCSP(content, path) {
  if (/index\.html$/.test(path)) {
    const html = content.toString('utf8');

    return (
      html.replace(
        '<meta http-equiv="Content-Security-Policy" content="script-src \'self\'" />',
        ''
      )
    );
  }

  return content;
}
