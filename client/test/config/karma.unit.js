'use strict';

var path = require('path');
var puppeteer = require('puppeteer');

// configures browsers to run test against
// any of [ 'ChromeHeadless', 'Chrome', 'Firefox', 'IE' ]
var TEST_BROWSERS = ((process.env.TEST_BROWSERS || '').replace(/^\s+|\s+$/, '') || 'ChromeHeadless').split(/\s*,\s*/g);

process.env.CHROME_BIN = puppeteer.executablePath();

// workaround https://github.com/GoogleChrome/puppeteer/issues/290
if (process.platform === 'linux') {
  TEST_BROWSERS = TEST_BROWSERS.map(function(browser) {
    if (browser === 'ChromeHeadless') {
      return 'ChromeHeadless_Linux';
    } else {
      return browser;
    }
  });

}

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

    browserNoActivityTimeout: 30000,

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
      paths: [
        absoluteLibPath,
        absoluteBasePath
      ]
    }
  });
};