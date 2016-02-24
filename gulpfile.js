'use strict';

var spawn = require('child_process').spawn,
    path = require('path'),
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
    which = require('which'),
    mocha = require('gulp-mocha');

var packager = require('electron-packager'),
    electron = require('electron-prebuilt'),
    cpr = require('ncp'),
    app = require('electron-connect').server.create({ path: 'app/develop' });

var assign = require('lodash/object/assign'),
    forEach = require('lodash/collection/forEach');

var PACKAGE_JSON = require('./package.json'),
    ELECTRON_VERSION = '0.34.3';


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

    // reload app on rebuild
    bundler.on('log', app.reload.bind(app, null, null));

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

/**
 * Async map a collection through a given iterator
 * and pass (err, mapping results) to the given done function.
 *
 * @param {Array<Object>} collection
 * @param {Function} iterator
 * @param {Function} done
 */
function asyncMap(collection, iterator, done) {

  var idx = -1;

  var results = [];

  function next() {
    idx++;

    if (idx === collection.length) {
      return done(null, results);
    }

    iterator(collection[idx], function(err, result) {

      if (err) {
        return done(err);
      }

      results.push(result);

      next();
    });
  }

  next();
}

var concat = require('concat-stream');

function replacePlaceholders(read, write, file) {

  if (!/(version|Info\.plist)$/.test(file.name)) {
    return read.pipe(write);
  }

  read.pipe(concat(function(body) {

    var bodyStr = body.toString('utf-8');
    var replacedBodyStr = bodyStr.replace(/<%= pkg\.version %>/g, PACKAGE_JSON.version);

    write.end(replacedBodyStr);
  }));
}

function createArchive(platform, path, done) {

  var archive,
      dest = path,
      output;

  if (platform === 'win32') {
    archive = archiver('zip', {});
    dest += '.zip';
  } else {
    if (platform === 'darwin') {
      dest = dest.replace(/Camunda Modeler/, 'camunda-modeler');
    }

    dest += '.tar.gz';
    archive = archiver('tar', { gzip: true });
  }

  output = fs.createWriteStream(dest);

  archive.pipe(output);
  archive.on('end', done);
  archive.on('error', done);

  archive.directory(path, 'camunda-modeler').finalize();
}

function amendAndArchive(platform, distroPaths, done) {

  var additionalAssets = [
    __dirname + '/resources/platform/' + platform,
    __dirname + '/resources/platform/base'
  ];

  function createDistro(distroPath, done) {

    function copyAssets(assetDirectory, done) {

      if (existsSync(assetDirectory)) {
        cpr(assetDirectory, distroPath, { transform: replacePlaceholders }, done);
      } else {
        done();
      }
    }

    function archive(err) {
      if (err) {
        return done(err);
      }

      createArchive(platform, distroPath, done);
    }

    asyncMap(additionalAssets, copyAssets, archive);
  }

  asyncMap(distroPaths, createDistro, done);
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

  if (platform === 'darwin') {
    opts.name = 'Camunda Modeler';
  }

  if (platform === 'win32') {
    opts['version-string'] = {
      CompanyName: 'camunda Services GmbH',
      LegalCopyright: 'camunda Services GmbH, 2015',
      FileDescription: 'Camunda Modeler',
      OriginalFilename: 'camunda-modeler.exe',
      // inherited by electron
      // FileVersion: ELECTRON_VERSION,
      ProductVersion: PACKAGE_JSON.version,
      ProductName: 'Camunda Modeler',
      InternalName: 'camunda-modeler'
    };
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
  app.start(__dirname + '/resources/diagram/simple.bpmn');

  // Restart browser process
  gulp.watch([ 'app/**/*.js' ], app.restart);

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
             .pipe(less({ paths: [ 'node_modules' ] }))
             .pipe(gulp.dest('public/css'));
});

gulp.task('client:copy:font', function() {
  return gulp.src('client/font/*').pipe(gulp.dest('public/font'));
});

gulp.task('client:copy:html', function() {
  return gulp.src('client/lib/index.html').pipe(gulp.dest('public/'));
});

gulp.task('diagram-js:css', function() {
  return gulp.src('node_modules/diagram-js/assets/diagram-js.css')
             .pipe(gulp.dest('public/vendor/diagram-js'));
});

gulp.task('properties-panel:less', function() {
  return gulp.src('node_modules/bpmn-js-properties-panel/styles/properties.less')
             .pipe(less())
             .pipe(gulp.dest('public/vendor/properties-panel'));
});

gulp.task('dmn-js:copy:font', function() {
  return gulp.src('node_modules/dmn-js/fonts/dmn-js.*').pipe(gulp.dest('public/vendor/fonts'));
});

gulp.task('dmn-js:less', function() {
  return gulp.src('node_modules/dmn-js/styles/dmn-js.less')
             .pipe(less({
               paths: [ path.join('node_modules/dmn-js', 'node_modules') ]
             }))
             .pipe(gulp.dest('public/vendor/dmn-js'));
});

gulp.task('test', function() {
  return gulp.src('test/spec/**/*.js', { read: false })
        .pipe(mocha({ require: [ './test/expect' ] }));
});

gulp.task('client:copy:vendor', runSequence([
  'diagram-js:css',
  'properties-panel:less',
  'dmn-js:less',
  'dmn-js:copy:font'
]));

gulp.task('client:copy', runSequence([
  'client:copy:font',
  'client:copy:vendor',
  'client:copy:html'
]));

gulp.task('debug', function() {
  return spawn(electron, [ '--debug-brk=5858' ], { stdio: 'inherit' });
});

gulp.task('package:windows', electronPackage('win32'));
gulp.task('package:darwin', electronPackage('darwin'));
gulp.task('package:linux', electronPackage('linux'));

gulp.task('package', runSequence('package:windows', 'package:darwin', 'package:linux'));

gulp.task('build', runSequence('client:build', 'client:less', 'client:copy'));

gulp.task('auto-build', runSequence([ 'client:build:watch', 'client:less', 'client:copy', 'serve' ]));

gulp.task('distro', runSequence('test', 'build', 'package'));

gulp.task('distro:windows', runSequence('build', 'package:windows'));
gulp.task('distro:darwin', runSequence('build', 'package:darwin'));
gulp.task('distro:linux', runSequence('build', 'package:linux'));

gulp.task('default', runSequence('test', 'build'));
