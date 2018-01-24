'use strict';

module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);
  require('time-grunt')(grunt);

  // project configuration
  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    karma: {
      options: {
        configFile: 'test/config/karma.unit.js'
      },
      single: {
        singleRun: true,
        autoWatch: false
      },
      unit: { }
    },

    browserify: {
      client: {
        src: 'lib/index.js',
        target: '../public/index.js'
      }
    },

    copy: {
      html: {
        files: [
          { src: 'lib/index.html', dest: '../public/index.html' }
        ]
      },
      fonts: {
        files: [
          {
            src: [
              'fonts/{app,bpmn,dmn}.*',
              'node_modules/cmmn-js/assets/cmmn-font/font/cmmn.*'
            ],
            dest: '../public/fonts',
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
            'lib',
            'styles',
            'node_modules'
          ]
        },
        files: {
          '../public/css/style.css': 'styles/app.less'
        }
      }
    },

    watch: {
      less: {
        files: [
          '{lib,styles}/**/*.less',
          'node_modules/diagram-js/assets/**/*.less',
          'node_modules/diagram-js/assets/**/*.css',
          'node_modules/bpmn-js-properties-panel/styles/**/*.less'
        ],
        tasks: [ 'less' ]
      },
      copy: {
        files: 'lib/index.html',
        tasks: [ 'copy' ]
      }
    }
  });

  grunt.loadTasks('tasks');

  // tasks

  grunt.registerTask('test', [ 'karma:single' ]);

  grunt.registerTask('auto-test', [ 'karma:unit' ]);

  grunt.registerTask('build-client', [
    'browserify:client',
    'less',
    'copy'
  ]);

  grunt.registerTask('default', [
    'test',
    'build-client'
  ]);

  grunt.registerTask('auto-build', [
    'browserify:client:watch',
    'less',
    'copy',
    'watch'
  ]);

};
