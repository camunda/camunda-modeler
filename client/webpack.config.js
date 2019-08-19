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

const DEV = process.env.NODE_ENV === 'development';
const LICENSE_CHECK = process.env.LICENSE_CHECK;

const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const { LicenseWebpackPlugin } = require('license-webpack-plugin');


module.exports = {
  mode: DEV ? 'development' : (LICENSE_CHECK ? 'none' : 'production'),
  target: 'web',
  entry: {
    bundle: ['./src/index.js']
  },
  output: {
    path: __dirname + '/build',
    filename: '[name].js',
    chunkFilename: '[name].[id].js'
  },
  resolve: DEV && {
    mainFields: [ 'browser', 'dev:module', 'module', 'main' ]
  } || { },
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
            test: /\.(bpmn|cmmn|dmn)$/,
            use: 'raw-loader'
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
            exclude: [/\.(js|jsx|mjs)$/, /\.html$/, /\.json$/],
            loader: 'file-loader',
            options: {
              name: 'static/media/[name].[hash:8].[ext]',
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new CaseSensitivePathsPlugin(),
    new CopyWebpackPlugin([
      {
        from: './public',
        transform: DEV && applyDevCSP
      }
    ]),
    ...extractDependencies()
  ],

  // don't bundle shims for node globals
  node: false,
  devServer: {
    writeToDisk: true
  },
  devtool: DEV ? 'cheap-module-eval-source-map' : 'source-map'
};



// helpers //////////////////////


function cssLoader() {

  if (DEV) {
    return {
      loader: 'css-loader',
      options: {
        localIdentName: '[path][name]__[local]--[hash:base64:5]'
      }
    };
  } else {
    return 'css-loader';
  }
}


function extractDependencies() {

  if (!LICENSE_CHECK) {
    return [];
  }

  return [
    new LicenseWebpackPlugin({
      outputFilename: 'dependencies.json',
      perChunkOutput: false,
      renderLicenses: (modules) => {

        const usedModules = modules.reduce((result, m) => {

          const {
            name,
            version
          } = m.packageJson;

          const id = `${name}@${version}`;

          return {
            ...result,
            [id]: true
          };
        }, {});

        return JSON.stringify(usedModules);
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
