'use strict';

var path = require('path');
var puppeteer = require('puppeteer');

// configures browsers to run test against
// any of [ 'ChromeHeadless', 'Chrome' ]
var TEST_BROWSERS =
  (process.env.TEST_BROWSERS || 'ChromeHeadless')
    .replace(/^\s+|\s+$/, '')
    .split(/\s*,\s*/g);

// workaround https://github.com/GoogleChrome/puppeteer/issues/290
TEST_BROWSERS = TEST_BROWSERS.map(function(browser) {

  if (browser === 'ChromeHeadless') {

    process.env.CHROME_BIN = puppeteer.executablePath();

    if (process.platform === 'linux') {

      // run no sandbox headless chrome
      return 'ChromeHeadless_Linux';
    }
  }

  return browser;
});


var basePath = '../../';

var absoluteBasePath = path.resolve(path.join(__dirname, basePath)),
    absoluteLibPath = path.resolve(path.join(__dirname, basePath, 'lib'));


module.exports = function(karma) {
  karma.set({

    basePath: basePath,

    frameworks: [
      'browserify',
      'mocha',
      'sinon-chai'
    ],

    files: [
      'test/**/*spec.js'
    ],

    preprocessors: {
      'test/**/*spec.js': [ 'browserify' ]
    },

    reporters: [ 'spec' ],

    browsers: TEST_BROWSERS,

    browserNoActivityTimeout: 100000,

    browserDisconnectTolerance: 2,

    customLaunchers: {
      ChromeHeadless_Linux: {
        base: 'ChromeHeadless',
        flags: [
          '--no-sandbox',
          '--disable-setuid-sandbox'
        ],
        debug: true
      }
    },

    singleRun: false,
    autoWatch: true,

    // browserify configuration
    browserify: {
      debug: true,
      transform: [
        [ 'babelify', { global: true } ],
        [ 'envify', { global: true } ],
        [ 'stringify', {
          'extensions': [
            '.bpmn',
            '.dmn',
            '.cmmn',
            '.xml',
            '.css',
            '.svg',
            '.png'
          ]
        } ]
      ],
      paths: [
        absoluteLibPath,
        absoluteBasePath
      ]
    }
  });
};