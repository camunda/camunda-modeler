/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

var parents = require('parents');

var path = require('path');

var findTemplates = require('./find-templates');


/**
 * Nop, you aint gonna load this configuration.
 */
function ElementTemplatesProvider(options) {

  const defaultPaths = options.paths;

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

    var searchPaths = [
      ...suffixAll(localPaths, '.camunda'),
      ...defaultPaths
    ];

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



// helpers //////////////////

function suffixAll(paths, suffix) {

  return paths.map(function(p) {
    return path.join(p, suffix);
  });
}