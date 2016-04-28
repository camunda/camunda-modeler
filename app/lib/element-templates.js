'use strict';

var fs = require('fs');

var glob = require('glob');

var isArray = require('lodash/lang/isArray');


function ElementTemplates(searchPaths) {
  this._searchPaths = searchPaths;

  this._templates = [];
}

ElementTemplates.prototype.loadSync = function() {

  var allTemplates = this._templates;
  var searchPaths = this._searchPaths;

  searchPaths.forEach(function(path) {
    var files;

    try {
      files = findTemplates(path);

      files.forEach(function(file) {
        var templates;

        try {
          templates = JSON.parse(fs.readFileSync(file, 'utf8'));

          if (!isArray(templates)) {
            templates = [ templates ];
          }

          templates.forEach(function(template) {
            allTemplates.push(template);
          });
        } catch (err) {
          console.log('[WARN] template <' + file + '> parse error', err);
        }
      });
    } catch (err) {
      console.log('[WARN] templates glob error', err);
    }
  });
};

ElementTemplates.prototype.get = function() {
  return this._templates;
};


function findTemplates(path) {

  var globOptions = {
    cwd: path,
    nodir: true,
    realpath: true
  };

  return glob.sync('resources/templates/**/*.json', globOptions);
}

module.exports.findTemplates = findTemplates;


/**
 * Load an existing element templates from given paths.
 *
 * @param {String} configPath
 *
 * @return {Config}
 */
function load(searchPaths) {

  var elementTemplates = new ElementTemplates(searchPaths);

  elementTemplates.loadSync();

  return elementTemplates;
}

module.exports.load = load;