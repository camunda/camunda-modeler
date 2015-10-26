'use strict';

var spawn = require('child_process').spawn,
    existsSync = require('fs').existsSync;

var gulp = require('gulp'),
    less = require('gulp-less'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    watchify = require('watchify'),
    errorify = require('errorify'),
    gutil = require('gulp-util'),
    browserify = require('browserify'),
    runSequence = require('gulp-sequence'),
    which = require('which');

var packager = require('electron-packager'),
    electron = require('electron-prebuilt'),
    copyRecursive = require('ncp'),
    app = require('electron-connect').server.create({ path: 'app/develop' });

var assign = require('lodash/object/assign'),
    forEach = require('lodash/collection/forEach');

var PACKAGE_JSON = require('./package.json'),
    ELECTRON_VERSION = '0.34.0';


// add custom browserify options here
var browserifyOptions = {
  entries: [ './client/lib/index.js' ],
  debug: true,
  transform: [ 'stringify' ]
};

// add transformations here
// i.e. b.transform(coffeeify);

function browserBundle(options) {

  var bundler,
      bundleOptions;

  function build() {
    return bundler
             .bundle()
             .pipe(source('index.js'))
             .pipe(buffer())
             .pipe(gulp.dest('public/'));
  }

  if (options && options.watch) {

    bundleOptions = assign({}, watchify.args, browserifyOptions);

    bundler = watchify(browserify(bundleOptions));

    bundler.plugin(errorify);

    bundler.on('update', build);

    bundler.on('error', gutil.log);
    bundler.on('log', gutil.log);
  } else {
    bundler = browserify(browserifyOptions);
  }

  bundler.build = build;

  return build();
}

function buildDistroIgnore() {

  var ignore = [
    'app/develop',
    'distro',
    'client',
    'resources',
    'test',
    '.editorconfig',
    '.gitignore',
    '.jshintrc',
    'gulpfile.js',
    'README.md'
  ];


  forEach(PACKAGE_JSON.devDependencies, function(version, name) {
    ignore.push('node_modules/' + name);
  });

  return new RegExp('(' + ignore.join('|') + ')');
}

var archiver = require('archiver'),
    fs = require('fs');

function createArchive(platform, path, done) {

  return function(err) {

    if (err) {
      return done(err);
    }

    var archive,
        dest = path,
        output;

    if (platform === 'win32') {
      archive = archiver('zip', {});
      dest += '.zip';
    } else {
      archive = archiver('tar', { gzip: true });
      dest += '.tar.gz';
    }

    output = fs.createWriteStream(dest);

    archive.pipe(output);
    archive.on('end', done);
    archive.on('error', done);

    archive.directory(path, 'camunda-modeler').finalize();
  };
}

function amendAndArchive(platform, paths, done) {

  var idx = 0;

  var platformAssets = __dirname + '/resources/' + platform;

  function processNext(err) {

    if (err) {
      return done(err);
    }

    var currentPath = paths[idx++];

    if (!currentPath) {
      return done(err, paths);
    }

    var archive = createArchive(platform, currentPath, processNext);

    if (existsSync(platformAssets)) {
      copyRecursive(platformAssets, currentPath, archive);
    } else {
      archive();
    }
  }

  processNext();
}

// package pre-built electron application for the given platform

function electronPackage(platform) {
  var opts = {
    name: PACKAGE_JSON.name,
    version: ELECTRON_VERSION,
    dir: '.',
    out: 'distro',
    overwrite: true,
    asar: true,
    arch: 'all',
    platform: platform,
    icon: __dirname + '/resources/icons/icon_128'
  };

  opts['app-version'] = PACKAGE_JSON.version;
  opts.ignore = buildDistroIgnore();

  if (process.platform === 'darwin') {
    opts.name = 'Camunda Modeler';
  }

  // make sure wine is available on linux systems
  // if we are building the windows distribution
  if (process.platform !== 'win32' && platform === 'win32') {
    try {
      which.sync('wine');
    } catch(e) {
      return function(done) {
        gutil.log(gutil.colors.yellow('Skipping Windows packaging: wine is not found'));
        done(null);
      };
    }
  }

  return function(done) {
    packager(opts, function(err, paths) {

      if (err) {
        return done(err);
      }

      return amendAndArchive(platform, paths, done);
    });
  };
}


gulp.task('serve', function () {

  // Start browser process
  app.start();

  // Restart browser process
  gulp.watch([ 'app/**/*.js' ], app.restart);

  // Reload renderer process
  gulp.watch([ 'client/lib/**/*.js' ], [ 'client:build', app.reload ]);
  gulp.watch([ 'client/lib/index.html' ], [ 'client:copy:html', app.reload ]);

  gulp.watch([ 'client/less/**.less' ], [ 'client:less', app.reload ]);
});

gulp.task('client:build:watch', function() {
  return browserBundle({ watch: true });
});

gulp.task('client:build', function() {
  return browserBundle();
});

gulp.task('client:less', function() {
  return gulp.src('client/less/app.less')
             .pipe(less({ paths: [ './node_modules/' ] }))
             .pipe(gulp.dest('public/css'));
});

gulp.task('client:copy:css', function() {
  return gulp.src('node_modules/diagram-js/assets/diagram-js.css')
             .pipe(gulp.dest('public/vendor/diagram-js'));
});

gulp.task('client:copy:font', function() {
  return gulp.src('client/font/font/*').pipe(gulp.dest('public/font'));
});

gulp.task('client:copy:html', function() {
  return gulp.src('client/lib/index.html').pipe(gulp.dest('public/'));
});

gulp.task('properties-panel:less', function() {
  gulp.src('node_modules/bpmn-js-properties-panel/styles/properties.less')
      .pipe(less())
      .pipe(gulp.dest('public/vendor/properties-panel'));
});

gulp.task('client:copy', runSequence([
  'client:copy:font',
  'client:copy:css',
  'client:copy:html'
]));

gulp.task('debug', function() {
  return spawn(electron, [ '--debug-brk=5858' ], { stdio: 'inherit' });
});

gulp.task('package:windows', electronPackage('win32'));
gulp.task('package:darwin', electronPackage('darwin'));
gulp.task('package:linux', electronPackage('linux'));

gulp.task('package', runSequence('package:windows', 'package:darwin', 'package:linux'));

gulp.task('build', runSequence('client:build', 'client:less', 'properties-panel:less', 'client:copy'));

gulp.task('auto-build', runSequence('build', 'serve'));

gulp.task('distro', runSequence('build', 'package'));

gulp.task('distro:windows', runSequence('build', 'package:windows'));
gulp.task('distro:darwin', runSequence('build', 'package:darwin'));
gulp.task('distro:linux', runSequence('build', 'package:linux'));

gulp.task('default', runSequence('build'));
