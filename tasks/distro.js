'use strict';

var semver = require('semver');

var fs = require('fs');
var which = require('which');
var forEach = require('lodash/collection/forEach');
var packager = require('electron-packager');
var cpr = require('ncp');
var archiver = require('archiver');
var concat = require('concat-stream');

var path = require('path');

var PACKAGE_JSON = require('../package.json');


module.exports = function(grunt) {

  grunt.registerMultiTask('distro', function(target) {

    var nightly = grunt.option('nightly');

    var buildVersion = grunt.option('build') || '0000';

    var appVersion = grunt.option('app-version');

    if (!appVersion) {
      appVersion = PACKAGE_JSON.version;

      if (nightly) {
        appVersion = semver.inc(appVersion, 'minor') + '-nightly';
      }
    }

    var electronVersion = PACKAGE_JSON.devDependencies['electron-prebuilt'];

    var platform = this.data.platform;
    var done = this.async();

    grunt.log.writeln(
      'Assembling distribution(s) ' +
      '{ version: ' + appVersion + ', build: ' + buildVersion + ' }');

    var iconPath = path.join(__dirname, '../resources/icons/icon_128'),
        dirPath = path.join(__dirname, '..'),
        outPath = path.join(__dirname, '../distro');

    grunt.log.writeln(iconPath, dirPath, outPath);

    var options = {
      name: PACKAGE_JSON.name,
      dir: dirPath,
      out: outPath,
      version: electronVersion,
      platform: platform,
      arch: 'all',
      overwrite: true,
      asar: true,
      icon: iconPath,
      ignore: buildDistroIgnore()
    };

    options['app-version'] = appVersion;
    options['build-version'] = buildVersion;

    if (platform === 'darwin') {
      options.name = 'Camunda Modeler';
    }

    if (platform === 'win32') {
      options['version-string'] = {
        CompanyName: 'camunda Services GmbH',
        LegalCopyright: 'camunda Services GmbH, 2015-2016',
        FileDescription: 'Camunda Modeler',
        OriginalFilename: 'camunda-modeler.exe',
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

      var replacements = {
        appVersion: appVersion,
        buildVersion: buildVersion
      };

      return amendAndArchive(platform, paths, replacements, done);
    });
  });
};


/**
 * Return function that acts as a replacer for the given
 * template variables for a ncp transform stream.
 *
 * Variables are passed as objects, replacement patterns
 * have to look like `<%= varName %>`. If not found,
 * replacements default to empty string.
 *
 * @param {Object} replacements
 *
 * @return {Function}
 */
function createReplacer(replacements) {

  return function replacePlaceholders(read, write, file) {

    if (!/(version|Info\.plist)$/.test(file.name)) {
      return read.pipe(write);
    }

    read.pipe(concat(function(body) {

      var bodyStr = body.toString('utf-8');
      var replacedBodyStr = bodyStr.replace(/<%= ([^\s]+) %>/g, function(_, name) {
        return replacements[name] || '';
      });

      write.end(replacedBodyStr);
    }));
  };
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


function amendAndArchive(platform, distroPaths, replacements, done) {

  var replaceTemplates = createReplacer(replacements);

  var additionalAssets = [
    __dirname + '/../resources/platform/base',
    __dirname + '/../resources/platform/' + platform
  ];

  function createDistro(distroPath, done) {

    function copyAssets(assetDirectory, done) {

      if (fs.existsSync(assetDirectory)) {
        cpr(assetDirectory, distroPath, { transform: replaceTemplates }, done);
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