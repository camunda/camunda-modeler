'use strict';

var parents = require('parents');

var path = require('path');

var findTemplates = require('./find-templates');


/**
 * Nop, you aint gonna load this configuration.
 */
function ElementTemplatesProvider(app) {

  /**
   * Return element templates for the given diagram.
   *
   * @param {String} key
   * @param {DiagramDescriptor} diagram
   * @param {Function} done
   */
  this.get = function(key, diagram, done) {

    if (typeof done !== 'function') {
      throw new Error('expected <done> callback');
    }

    var localPaths = diagram ? parents(diagram.path) : [];

    var defaultPaths = [
      app.getPath('userData'),
      app.developmentMode ? process.cwd() : path.dirname(app.getPath('exe'))
    ];

    var searchPaths = [].concat(
      suffixAll(localPaths, '.camunda'),
      suffixAll(defaultPaths, 'resources')
    );

    var templates = [];

    try {
      templates = findTemplates(searchPaths);

      done(null, templates);
    } catch (err) {
      done(err);
    }
  };

}

module.exports = ElementTemplatesProvider;



/////////// helpers ///////////////////////////

function suffixAll(paths, suffix) {

  return paths.map(function(p) {
    return path.join(p, suffix);
  });
}