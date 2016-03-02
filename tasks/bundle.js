'use strict';

var browserify = require('browserify'),
    watchify = require('watchify'),
    errorify = require('errorify');

var fs = require('fs'),
    path = require('path');

module.exports = function(grunt) {

  function writableStream(filePath) {

    // ensure target directory is readable
    grunt.file.mkdir(path.dirname(filePath));

    return fs.createWriteStream(filePath);
  }

  // can be invoked with name:watch or without
  grunt.registerMultiTask('browserify', function(target) {

    var data = this.data;

    var srcFile = data.src,
        targetFile = data.target;

    // completion handler; do not block per default
    var done = function() {};

    var browserifyOptions = {
      builtins: {
        assert: require.resolve('assert/'),
        events: require.resolve('events/')
      },
      ignoreMissing: true,
      paths: ['client/lib'],
      insertGlobalVars: {
        process: function() {
          return 'undefined';
        },
        Buffer: function() {
          return 'undefined';
        }
      }
    };

    var b;

    if (target === 'watch') {

      browserifyOptions.debug = true;
      browserifyOptions.cache = {};
      browserifyOptions.packageCache = {};

      b = browserify(browserifyOptions)
        .plugin(watchify)
        .plugin(errorify);

      b.on('update', function(files) {
        grunt.log.ok('[browserify] sources updated');

        b.bundle().pipe(writableStream(targetFile));
      });

      b.on('log', function(msg) {
        grunt.log.ok('[browserify] %s', msg);
      });
    } else {
      b = browserify(browserifyOptions);

      b.on('error', function(err) {
        grunt.fail.warn('[browserify] error', err);
      });

      // block until completion
      done = this.async();
    }

    b.add(srcFile);

    grunt.log.ok('[browserify] bundling', srcFile);

    b.bundle(done).pipe(writableStream(targetFile));
  });

};
