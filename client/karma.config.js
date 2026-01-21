/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

var coverage = process.env.COVERAGE,
    modelers = process.env.MODELERS;

if (coverage) {

  // must set NODE_ENV to coverage to activate
  // babel-plugin-istanbul (cf. babel config)
  process.env.NODE_ENV = 'coverage';
}

var path = require('path');
var os = require('os');

var platform = os.platform();
var windows = /^win/.test(platform);

var { DefinePlugin } = require('webpack');
var MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

var absoluteBasePath = path.resolve(__dirname);
var resourcePath = path.resolve(__dirname + '/resources');

process.env.CHROME_BIN = require('puppeteer').executablePath();

// configures browsers to run test against
// any of [ 'ChromeHeadless', 'Chrome', 'Firefox', 'IE', 'PhantomJS' ]
var browsers = (process.env.TEST_BROWSERS || 'ChromeHeadless').split(/,/g);

var suite = 'test/suite.js';

if (modelers) {
  suite = 'test/modelers.js';
} else if (coverage) {
  suite = 'test/all.js';
}


module.exports = function(karma) {
  karma.set({

    frameworks: [
      'mocha',
      'sinon-chai',
      'webpack'
    ],

    files: [
      suite
    ],

    preprocessors: {
      [suite]: [ 'webpack', 'env' ]
    },

    reporters: [ 'progress' ].concat(coverage ? 'coverage' : []),

    coverageReporter: {
      reporters: [
        { type: 'lcov', subdir: modelers ? 'modelers' : 'all' }
      ]
    },

    browsers: browsers,

    browserNoActivityTimeout: 60000,
    browserDisconnectTolerance: 3,
    browserSocketTimeout: 60000,
    browserDisconnectTimeout: 60000,
    pingTimeout: 60000,

    singleRun: true,
    autoWatch: false,

    client: {
      mocha: {
        timeout: 10000
      }
    },

    webpack: {
      mode: 'none',
      module: {
        rules: [
          {
            test: /\.bpmnlintrc$/,
            use: 'bpmnlint-loader'
          },
          {
            test: /\.js$/,
            exclude: /node_modules/,
            use: 'babel-loader'
          },
          {
            oneOf: [
              {
                test: /[/\\][A-Z][^/\\]+\.svg$/,
                use: 'react-svg-loader'
              },
              {
                test: /\.(css|bpmn|dmn|less|xml|png|svg|form|rpa)$/,
                type: 'asset/source'
              }
            ]
          }
        ]
      },
      stats: 'normal',
      cache: {
        type: 'memory'
      },
      plugins: [
        new DefinePlugin({
          'process.env': {
            NODE_ENV: JSON.stringify('test'),
            WINDOWS: JSON.stringify(windows)
          }
        }),
        new MonacoWebpackPlugin()
      ],
      resolve: {
        mainFields: [
          'dev:module',
          'browser',
          'module',
          'main'
        ],
        modules: [
          'node_modules',
          absoluteBasePath,
          resourcePath
        ],
        alias: {
          'bpmn-js/lib/Modeler': modelers ? 'bpmn-js/lib/Modeler' : 'test/mocks/bpmn-js/Modeler',
          'camunda-bpmn-js/lib/camunda-cloud/Modeler': modelers ? 'camunda-bpmn-js/lib/camunda-cloud/Modeler' : 'test/mocks/bpmn-js/Modeler',
          'camunda-bpmn-js/lib/camunda-platform/Modeler': modelers ? 'camunda-bpmn-js/lib/camunda-platform/Modeler' : 'test/mocks/bpmn-js/Modeler',
          'camunda-dmn-js$': modelers ? 'camunda-dmn-js' : 'test/mocks/dmn-js/Modeler',
          './DmnModeler': modelers ? './DmnModeler' : 'test/mocks/dmn-js/Modeler',
          './CodeMirror': 'test/mocks/code-mirror/CodeMirror',
          'sourcemapped-stacktrace': 'test/mocks/sourcemapped-stacktrace',
          './editor/FormEditor': 'test/mocks/form-js',
          '@camunda/linting': 'test/mocks/linting',
          '@camunda/linting/modeler': 'test/mocks/linting/modeler',
          'mixpanel-browser': 'test/mocks/mixpanel-browser',
          '../../globals': 'test/mocks/globals'
        }
      },
      devtool: 'eval-cheap-module-source-map'
    }
  });
};
