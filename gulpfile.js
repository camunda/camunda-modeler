'use strict';

var gulp = require('gulp'),
    run = require('gulp-run'),
    electron = require('electron-connect').server.create();


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

gulp.task('default', [ 'serve' ]);
