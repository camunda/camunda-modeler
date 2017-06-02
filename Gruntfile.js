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
      check: {
        src: [
          'client/{lib,test}/**/*.js',
          'app/{lib,test,develop}/**/*.js'
        ]
      },
      fix: {
        src: [
          'client/{lib,test}/**/*.js',
          'app/{lib,test,develop}/**/*.js'
        ],
        options: {
          fix: true
        }
      }
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
      client: 'public',
      distro: 'distro'
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
              'client/fonts/{app,bpmn,dmn}.*',
              'node_modules/cmmn-js/assets/cmmn-font/font/cmmn.*'
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
    },

    /**
     * Builds the distribution for all available platforms.
     *
     * Accepts the following flags:
     *
     *  --build=buildNumber
     *  --app-version=someVersion
     *  --nightly
     *
     *  Nightly will build a new minor version based on the
     *  current application version.
     *
     * NOTE: Because of a grunt bug (https://github.com/gruntjs/grunt/issues/920)
     * you need to specify the --nightly parameter last.
     */
    distro: {
      darwin: {
        platform: 'darwin'
      },
      windows: {
        platform: 'win32'
      },
      linux: {
        platform: 'linux'
      }
    },

    watch: {
      less: {
        files: [
          'client/{lib,styles}/**/*.less',
          'node_modules/diagram-js/assets/**/*.less',
          'node_modules/diagram-js/assets/**/*.css',
          'node_modules/dmn-js/styles/**/*.less',
          'node_modules/bpmn-js-properties-panel/styles/**/*.less'
        ],
        tasks: [ 'less' ]
      },
      copy: {
        files: 'client/lib/index.html',
        tasks: [ 'copy' ]
      },
      client: {
        files: 'public/**/*',
        tasks: [ 'app:reload' ],
        options: {
          spawn: false
        }
      },
      app: {
        files: 'app/**/*',
        tasks: [ 'app:restart' ],
        options: {
          spawn: false
        }
      },
      mocha: {
        files: 'app/**/*',
        tasks: [ 'mochaTest:watch' ]
      }
    },

    /**
     * Watch, but focus on only a subset of the
     * defined watch tasks.
     */
    focus: {
      client: {
        exclude: [ 'mocha' ]
      },
      app: {
        include: [ 'mocha' ]
      }
    },

    mochaTest: {
      single: {
        options: {
          reporter: 'spec',
          require: [ './app/test/expect' ]
        },
        src: [ './app/test/spec/**/*.js' ]
      },
      watch: {
        options: {
          noFail: true,
          reporter: 'spec',
          require: [ './app/test/expect' ]
        },
        src: [ './app/test/spec/**/*.js' ]
      }
    }
  });

  grunt.loadTasks('tasks');

  // tasks

  grunt.registerTask('lint', [ 'eslint:check' ]);

  grunt.registerTask('lint-fix', [ 'eslint:fix' ]);

  grunt.registerTask('test', [ 'karma:single', 'mochaTest:single' ]);

  grunt.registerTask('auto-test', [ 'karma:unit' ]);

  grunt.registerTask('auto-test-app', [ 'mochaTest:watch', 'focus:app' ]);

  grunt.registerTask('build-client', [
    'clean:client',
    'browserify:client',
    'less',
    'copy'
  ]);

  grunt.registerTask('dev', [ 'lint', 'test', 'build-client' ]);

  grunt.registerTask('default', [ 'lint', 'test', 'build-client', 'clean:distro', 'distro' ]);

  // Development setup tasks
  var server = require('electron-connect').server.create({ path: 'app/develop' });

  grunt.registerTask('app:start', server.start);

  grunt.registerTask('app:restart', server.restart);

  grunt.registerTask('app:reload', server.reload);

  grunt.registerTask('auto-build', [
    'clean:client',
    'browserify:client:watch',
    'less',
    'copy',
    'app:start',
    'focus:client'
  ]);
};
