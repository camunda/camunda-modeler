'use strict';

var path = require('path');

var ElementTemplates = require('./element-templates');

/**
 * A configuration that is provided
 * to the client during bootstrapping.
 */
function ClientConfig(app) {

  /**
   * Load the configuration.
   *
   * @return {Object}
   */
  this.load = function() {
    return {
      'bpmn.elementTemplates': loadTemplates(app)
    };
  };
}

module.exports = ClientConfig;


function loadTemplates(app) {

  var templatePaths = [
    app.getPath('userData'),
    app.developmentMode ? process.cwd() : path.dirname(app.getPath('exe'))
  ];

  return ElementTemplates.load(templatePaths).get();
}

module.exports.loadTemplates = loadTemplates;