'use strict';

var fs = require('fs');
var which = require('which');
var packager = require('electron-packager');
var cpr = require('ncp');
var archiver = require('archiver');
var concat = require('concat-stream');

var path = require('path');

var PACKAGE_JSON = require('../package.json');

var getAppVersion = require('../app/util/get-version'),
    patchPkgVersion = require('../app/util/patch-pkg-version');


module.exports = function(grunt) {

  grunt.registerMultiTask('distro', function(target) {

    var nightly = grunt.option('nightly');

    var buildVersion = grunt.option('build') || '0000';

    var appVersion = grunt.option('app-version') || getAppVersion(PACKAGE_JSON, {
      nightly: nightly ? 'nightly' : false
    });

    // monkey patch version in package.json
    patchPkgVersion(appVersion);

    var platform = this.data.platform;

    var __done = this.async();
    var done = function(err) {
      // restore old version in package.json
      patchPkgVersion(PACKAGE_JSON.version);

      __done(err);
    };

    grunt.log.writeln(
      'Assembling distribution(s) for ' + platform + ' ' +
      '{ version: ' + appVersion + ', build: ' + buildVersion + ' }');

    var iconPath = path.join(__dirname, '../resources/icons/icon_128'),
        dirPath = path.join(__dirname, '..'),
        outPath = path.join(__dirname, '../distro');

    var options = {
      name: PACKAGE_JSON.name,
      dir: dirPath,
      out: outPath,
      platform: platform,
      arch: [ 'ia32', 'x64' ],
      overwrite: true,
      prune: true,
      asar: true,
      icon: iconPath,
      ignore: buildDistroIgnore(),
      appVersion: appVersion,
      appCopyright: 'camunda Services GmbH, 2015-2017',
      buildVersion: buildVersion
    };

    if (platform === 'darwin') {
      options.name = 'Camunda Modeler';
    }

    if (platform === 'win32') {
      options['win32metadata'] = {
        CompanyName: 'camunda Services GmbH',
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
    'app/test',
    'app/util',
    'client',
    'distro',
    'docs',
    'resources',
    'tasks',
    '.babelrc',
    '.editorconfig',
    '.eslintrc',
    '.gitignore',
    '.travis.yml',
    '.wiredeps',
    'Gruntfile.js',
    'npm-shrinkwrap.json',
    'README.md'
  ];

  return new RegExp('^/(' + ignore.join('|') + ')');
}
