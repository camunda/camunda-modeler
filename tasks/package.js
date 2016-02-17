'use strict';

var fs = require('fs');
var which = require('which');
var forEach = require('lodash/collection/forEach');
var packager = require('electron-packager');
var copyRecursive = require('ncp');
var archiver = require('archiver');

module.exports = function(grunt) {

  grunt.registerMultiTask('distro', function(target) {
    var packageJson = require('../package.json');
    var electronVersion = '0.34.3';

    var platform = this.data.platform;
    var done = this.async();

    var options = {
      name: packageJson.name,
      dir: __dirname + '/../',
      out: __dirname + '/../distro',
      version: electronVersion,
      platform: platform,
      arch: 'all',
      'app-version': packageJson.version,
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

      forEach(packageJson.devDependencies, function(version, name) {
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
        ProductVersion: packageJson.version,
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

    function amendAndArchive(platform, paths, done) {

      var idx = 0;

      var platformAssets = __dirname + '/../resources/' + platform;

      function processNext(err) {

        if (err) {
          return done(err);
        }

        var currentPath = paths[idx++];

        if (!currentPath) {
          return done(err, paths);
        }

        var archive = createArchive(platform, currentPath, processNext);

        if (fs.existsSync(platformAssets)) {
          copyRecursive(platformAssets, currentPath, archive);
        } else {
          archive();
        }
      }

      processNext();
    }

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
          if (platform === 'darwin') {
            dest = dest.replace(/Camunda Modeler/, 'camunda-modeler');
          }

          dest += '.tar.gz';
          archive = archiver('tar', {
            gzip: true
          });
        }

        output = fs.createWriteStream(dest);

        archive.pipe(output);
        archive.on('end', done);
        archive.on('error', done);

        archive.directory(path, 'camunda-modeler').finalize();
      };
    }
  });

};
