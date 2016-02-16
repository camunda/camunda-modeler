'use strict';

module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);
  require('time-grunt')(grunt);

  /* global process */

  // configures browsers to run test against
  // any of [ 'PhantomJS', 'Chrome', 'Firefox', 'IE']
  var TEST_BROWSERS = ((process.env.TEST_BROWSERS || '').replace(/^\s+|\s+$/, '') || 'PhantomJS').split(/\s*,\s*/g);

  // project configuration
  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),
    
    eslint: {
      client: [ 'client/{lib,test}/**/*.js' ],
      // TODO(nre): restructure back-end and enable
      // app: [ 'app/{lib,test}/**/*.js' ]
    },

    release: {
      options: {
        tagName: 'v<%= version %>',
        commitMessage: 'chore(project): release v<%= version %>',
        tagMessage: 'chore(project): tag v<%= version %>',
        npm: false
      }
    },

    clean: {
      client: [ 'public' ]
    },
    
    karma: {
      options: {
        configFile: 'client/test/config/karma.unit.js'
      },
      single: {
        singleRun: true,
        autoWatch: false,

        browsers: TEST_BROWSERS
      },
      unit: {
        browsers: TEST_BROWSERS
      }
    },

    browserify: {
      client: {
        src: 'client/lib/index.js',
        target: 'public/index.js'
      }
    },

    copy: {
      html: {
        files: [
          { src: 'client/lib/index.html', dest: 'public/index.html' }
        ]
      },
      fonts: {
        files: [
          {
            src: [
              'client/fonts/{app,bpmn}.*',
              'node_modules/dmn-js/fonts/dmn-js.*'
            ],
            dest: 'public/fonts',
            expand: true,
            flatten: true
          }
        ]
      }
    },
    
    less: {
      app: {
        options: {
          paths: [
            'client/lib',
            'client/styles',
            'node_modules'
          ]
        },
        files: {
          'public/css/style.css': 'client/styles/app.less'
        }
      }
    }
  });

  grunt.loadTasks('tasks');


  // tasks

  grunt.registerTask('test', [ 'karma:single' ]);

  grunt.registerTask('auto-test', [ 'karma:unit' ]);

  grunt.registerTask('build:client', [ 'clean', 'browserify', 'less', 'copy' ]);

  grunt.registerTask('default', [ 'eslint', 'test', 'build:client' ]);
};