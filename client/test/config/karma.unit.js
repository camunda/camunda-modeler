'use strict';

var path = require('path');
var puppeteer = require('puppeteer');

// configures browsers to run test against
// any of [ 'PhantomJS', 'ChromeHeadless', 'Chrome', 'Firefox', 'IE' ]
var TEST_BROWSERS = ((process.env.TEST_BROWSERS || '').replace(/^\s+|\s+$/, '') || 'ChromeHeadless').split(/\s*,\s*/g);


// force PhantomJS usage on build Jenkins
if (process.env.JENKINS_URL) {
  console.log('Detected build Jenkins; using TEST_BROWSERS=PhantomJS');

  TEST_BROWSERS = [ 'PhantomJS' ];
}

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