'use strict';

var fs = require('fs');
var which = require('which');
var forEach = require('lodash/collection/forEach');
var packager = require('electron-packager');
var cpr = require('ncp');
var archiver = require('archiver');
var concat = require('concat-stream');

var PACKAGE_JSON = require('../package.json');


module.exports = function(grunt) {

  grunt.registerMultiTask('distro', function(target) {

    var electronVersion = PACKAGE_JSON.devDependencies['electron-prebuilt'];

    var platform = this.data.platform;
    var done = this.async();

    var options = {
      name: PACKAGE_JSON.name,
      dir: __dirname + '/../',
      out: __dirname + '/../distro',
      version: electronVersion,
      platform: platform,
      arch: 'all',
      'app-version': PACKAGE_JSON.version,
      overwrite: true,
      asar: true,
      icon: __dirname + '/../resources/icons/icon_128',
      ignore: buildDistroIgnore()
    };

    function buildDistroIgnore() {

      var ignore = [
        'app/develop',
        'distro',
        'client',
        'resources',
        'app/test',
        '.babelrc',
        '.editorconfig',
        '.eslintrc',
        '.gitignore',
        '.travis.yml',
        '.wiredeps',
        'Gruntfile.js',
        'gulpfile.js',
        'README.md'
      ];

      forEach(PACKAGE_JSON.devDependencies, function(version, name) {
        ignore.push('node_modules/' + name);
      });

      return new RegExp('(' + ignore.join('|') + ')');
    }

    if (platform === 'darwin') {
      options.name = 'Camunda Modeler';
    }

    if (platform === 'win32') {
      options['version-string'] = {
        CompanyName: 'camunda Services GmbH',
        LegalCopyright: 'camunda Services GmbH, 2015',
        FileDescription: 'Camunda Modeler',
        OriginalFilename: 'camunda-modeler.exe',
        // inherited by electron
        // FileVersion: electronVersion,
        ProductVersion: PACKAGE_JSON.version,
        ProductName: 'Camunda Modeler',
        InternalName: 'camunda-modeler'
      };

      // make sure wine is available on linux systems
      // if we are building the windows distribution
      if (process.platform !== 'win32' && platform === 'win32') {
        try {
          which.sync('wine');
        } catch (e) {
          grunt.log.writeln('Skipping Windows packaging: wine is not found'['red']);
          return done();
        }
      }
    }


    packager(options, function(err, paths) {

      if (err) {
        return done(err);
      }

      return amendAndArchive(platform, paths, done);
    });
  });
}


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
    __dirname + '/../resources/platform/base',
    __dirname + '/../resources/platform/' + platform
  ];

  function createDistro(distroPath, done) {

    function copyAssets(assetDirectory, done) {

      if (fs.existsSync(assetDirectory)) {
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