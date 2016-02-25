'use strict';

var path = require('path');

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

    browsers: [ 'PhantomJS' ],

    browserNoActivityTimeout: 30000,

    singleRun: false,
    autoWatch: true,

    // browserify configuration
    browserify: {
      debug: true,
      paths: [ absoluteLibPath, absoluteBasePath ]
    }
  });
};