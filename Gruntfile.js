'use strict';

module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);
  require('time-grunt')(grunt);

  // project configuration
  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    clean: {
      client: 'public',
      distro: 'distro'
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
      app: {
        exclude: [ 'mocha' ]
      },
      test: {
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

  grunt.registerTask('test', [ 'mochaTest:single' ]);

  grunt.registerTask('auto-test', [ 'mochaTest:watch', 'focus:test' ]);

  grunt.registerTask('default', [
    'test',
    'distro'
  ]);

  // Development setup tasks
  var server = require('electron-connect').server.create({ path: 'app/develop' });

  grunt.registerTask('app:start', server.start);

  grunt.registerTask('app:restart', server.restart);

  grunt.registerTask('app:reload', server.reload);

  grunt.registerTask('auto-build', [
    'app:start',
    'focus:app'
  ]);
};
