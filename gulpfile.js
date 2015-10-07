'use strict';

var gulp = require('gulp'),
    run = require('gulp-run'),
    packager = require('electron-packager'),
    electron = require('electron-connect').server.create();


var ELECTRON_PACKAGER_VERSION = '0.33.0';

function getPackageOptions(platform) {
  var options = {
    name: 'camunda-modeler',
    version: ELECTRON_PACKAGER_VERSION,
    dir: '.',
    out: 'distro',
    //platform: 'all', # will be set in dist-<platform> task
    arch: 'all',
    overwrite: true
  };

  options.platform = platform;

  return options;
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
  var opts = getPackageOptions('win32');

  return packager(opts, function(err, appPath) {
    return appPath;
  });
});

gulp.task('dist-osx', function() {
  var opts = getPackageOptions('darwin');

  return packager(opts, function(err, appPath) {
    return appPath;
  });
});

gulp.task('dist-linux', function() {
  var opts = getPackageOptions('linux');

  return packager(opts, function(err, appPath) {
    return appPath;
  });
});

gulp.task('dist', [ 'dist-windows', 'dist-darwin', 'dist-linux' ]);

gulp.task('default', [ 'serve' ]);
