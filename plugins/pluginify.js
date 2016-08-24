'use strict';

/**
 * Tool that is used to validate and set Camunda Modeler plugin.
 *
 * Use it like so in the bundle file:
 *
 *    var pluginify = require('camunda-modeler-pluginify');
 *    var module = require('./index');
 *
 *    pluginify({
 *      type: 'bpmn.modeler.additionalModules',
 *      module: module
 *    });
 *
 * @param {Object} plugin
 */
function CamundaModelerPlugin(plugin) {
  var plugins = window.plugins || [];
  window.plugins = plugins;

  if (!plugin) {
    throw new Error('Descriptor in not specified!');
  }

  [ 'type', 'module' ].forEach(function(p) {
    if (!plugin[p]) {
      throw new Error('Propery "' + p + '" must be specified!');
    }
  });

  plugins.push(plugin);
}

module.exports = CamundaModelerPlugin;