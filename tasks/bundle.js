'use strict';

var browserify = require('browserify');


module.exports = function(grunt) {

  grunt.registerMultiTask('browserify', function(target) {

    var data = this.data;
    
    var srcFile = data.src,
        targetFile = data.target;
    
    var done = this.async();

    var browserifyOptions = {
      debug: true,
      builtins: false,
      paths: [ 'client/lib' ],
      insertGlobalVars: {
        process: function () {
          return 'undefined';
        },
        Buffer: function () {
          return 'undefined';
        }
      }
    };

    browserify(browserifyOptions)
      .add(srcFile)
      .bundle(function(err, result) {

        if (err) {
          return done(err);
        }

        grunt.file.write(targetFile, result, 'utf-8');
        
        done();
      });

  });

};