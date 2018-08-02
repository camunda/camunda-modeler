'use strict';

const {
  dirname
} = require('path');

function resolvePath(path) {

  const match = /^([^/]*)(.*)$/.exec(path);

  return dirname(require.resolve(match[1] + '/package.json')) + match[2];
}

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
        target: '../app/public/index.js'
      }
    },

    copy: {
      html: {
        files: [
          {
            src: 'lib/index.html',
            dest: '../app/public/index.html'
          }
        ]
      },
      app_fonts: {
        files: [
          {
            src: 'fonts/app.*',
            dest: '../app/public/fonts/',
            expand: true,
            flatten: true
          }
        ]
      },
      cmmn_js: {
        files: [
          {
            cwd: resolvePath('cmmn-js/dist/'),
            src: [ '**/*', '!**/*.js' ],
            dest: '../app/public/vendor/cmmn-js/',
            expand: true
          }
        ]
      },
      dmn_js: {
        files: [
          {
            cwd: resolvePath('dmn-js/dist/'),
            src: [ '**/*', '!**/*.js' ],
            dest: '../app/public/vendor/dmn-js/',
            expand: true
          }
        ]
      },
      bpmn_js: {
        files: [
          {
            cwd: resolvePath('bpmn-js/dist/'),
            src: [ '**/*', '!**/*.js' ],
            dest: '../app/public/vendor/bpmn-js/',
            expand: true
          }
        ]
      },
      diagram_js: {
        files: [
          {
            cwd: resolvePath('diagram-js/'),
            src: [ '!**/*.js', 'assets/**/*' ],
            dest: '../app/public/vendor/diagram-js/',
            expand: true
          }
        ]
      },
      diagram_js_minimap: {
        files: [
          {
            cwd: resolvePath('diagram-js-minimap'),
            src: [ 'assets/**/*' ],
            dest: '../app/public/vendor/diagram-js-minimap/',
            expand: true
          }
        ]
      },
      dmn_js_properties_panel: {
        files: [
          {
            cwd: resolvePath('dmn-js-properties-panel'),
            src: [ 'dist/assets/**/*' ],
            dest: '../app/public/vendor/dmn-js-properties-panel/',
            expand: true
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
          '../app/public/css/style.css': 'styles/app.less'
        }
      }
    },

    watch: {
      less: {
        files: [
          '{lib,styles}/**/*.less',
          resolvePath('diagram-js/assets/**.css'),
          resolvePath('bpmn-js-properties-panel/styles/**/*.less')
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

  grunt.registerTask('build', [
    'browserify:client',
    'less',
    'copy'
  ]);

  grunt.registerTask('default', [
    'test',
    'build'
  ]);

  grunt.registerTask('auto-build', [
    'browserify:client:watch',
    'less',
    'copy',
    'watch'
  ]);

};
