'use strict';

var gulp = require('gulp'),
    run = require('gulp-run'),
    packager = require('electron-packager'),
    electron = require('electron-connect').server.create(),
    _ = require('lodash');

var ELECTRON_PACKAGER_VERSION='0.33.0'
var PACKAGING_OPTS = {
  name: 'camunda-modeler',
  version: ELECTRON_PACKAGER_VERSION,
  dir: '.',
  out: 'distro',
  //platform: 'all', # will be set in dist-<platform> task
  arch: 'all',
  overwrite: true
}

gulp.task('serve', function () {

  // Start browser process
  electron.start();

  // Restart browser process
  gulp.watch([ 'index.js', 'app/**/*.js'], electron.restart);

  // Reload renderer process
  gulp.watch(['./client/**/*.js', 'index.html'], electron.reload);
});

gulp.task('run', function() {
  return run('electron .').exec();
});

gulp.task('debug', function() {
  return run('electron --debug-brk=5858 .').exec();
});

gulp.task('dist-windows', function() {
  var opts = {
    platform: 'win32'
  }
  opts = _.merge(PACKAGING_OPTS, opts)

  return packager(opts, function(err, appPath) {
    return appPath;
  });
});

gulp.task('dist-osx', function() {
  var opts = {
    platform: 'darwin'
  }
  opts = _.merge(PACKAGING_OPTS, opts)

  return packager(opts, function(err, appPath) {
    return appPath;
  });
});

gulp.task('dist-linux', function() {
  var opts = {
    platform: 'linux'
  }
  opts = _.merge(PACKAGING_OPTS, opts)

  return packager(opts, function(err, appPath) {
    return appPath;
  });
});

gulp.task('dist', ['dist-windows', 'dist-darwin', 'dist-linux']);

gulp.task('default', [ 'serve' ]);
