'use strict';

var spawn = require('child_process').spawn;

var gulp = require('gulp'),
    less = require('gulp-less'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    watchify = require('watchify'),
    errorify = require('errorify'),
    gutil = require('gulp-util'),
    browserify = require('browserify'),
    runSequence = require('gulp-sequence');

var packager = require('electron-packager'),
    electron = require('electron-prebuilt'),
    app = require('electron-connect').server.create();

var assign = require('lodash/object/assign');


var ELECTRON_PACKAGER_VERSION = '0.33.0';

function getPackageOptions(platform) {
  var options = {
    name: 'camunda-modeler',
    version: ELECTRON_PACKAGER_VERSION,
    dir: '.',
    out: 'distro',
    arch: 'all',
    overwrite: true
  };

  options.platform = platform;

  return options;
}

// add custom browserify options here
var browserifyOptions = {
  entries: [ './client/lib/index.js' ],
  debug: true,
  transform: [ 'stringify' ]
};

// add transformations here
// i.e. b.transform(coffeeify);

function bundle(options) {

  var bundler,
      bundleOptions;

  function build() {
    return bundler
             .bundle()
             .pipe(source('index.js'))
             .pipe(buffer())
             .pipe(gulp.dest('dist'));
  }

  if (options && options.watch) {

    bundleOptions = assign({}, watchify.args, browserifyOptions);

    bundler = watchify(browserify(bundleOptions));

    bundler.plugin(errorify);

    bundler.on('update', build);

    bundler.on('log', gutil.log);
  } else {
    bundler = browserify(browserifyOptions);
  }

  bundler.build = build;

  return bundler;
}

gulp.task('serve', function () {

  // Start browser process
  app.start();

  // Restart browser process
  gulp.watch([ 'index.js', './app/**/*.js'], app.restart);

  // Reload renderer process
  gulp.watch([ './client/**/*.js', 'index.html'], [ 'client:build', app.reload ]);

  gulp.watch([ './client/less/*.less', [ 'client:less', app.reload ] ]);
});

gulp.task('client:build:watch', function() {
  return bundle({ watch: true }).build();
});

gulp.task('client:build', function() {
  return bundle().build();
});

gulp.task('client:less', function() {
  return gulp.src('client/less/app.less')
        .pipe(less({
          paths: [ './node_modules/' ]
        }))
        .pipe(gulp.dest('dist/css'));
});

gulp.task('client:copy:css', function() {
  return gulp.src('node_modules/diagram-js/assets/diagram-js.css')
        .pipe(gulp.dest('dist/vendor/diagram-js'));
});

gulp.task('client:copy:icons', function() {
  return gulp.src( 'client/icons/*')
        .pipe(gulp.dest('dist'));
});

gulp.task('client:copy:font', function() {
  return gulp.src('client/font/font/*')
        .pipe(gulp.dest('dist/font'));
});

gulp.task('client:copy:html', function() {
  return gulp.src('client/lib/dialog/confirm.html')
        .pipe(gulp.dest('dist'));
});

gulp.task('client:copy', runSequence([ 'client:copy:font', 'client:copy:icons', 'client:copy:css', 'client:copy:html' ]));

gulp.task('debug', function() {
  return spawn(electron, [ '--debug-brk=5858' ], { stdio: 'inherit' });
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

gulp.task('dist', runSequence([ 'dist-windows', 'dist-darwin', 'dist-linux' ]));

gulp.task('build', runSequence('client:build', 'client:less', 'client:copy'));

gulp.task('auto-build', runSequence('build', 'serve'));

gulp.task('default', [ 'build' ]);
