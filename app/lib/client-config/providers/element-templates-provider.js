/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
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

    var localPaths = diagram && diagram.file && diagram.file.path ? parents(diagram.file.path) : [];

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
