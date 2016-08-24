'use strict';

var path = require('path'),
    glob = require('glob');

/**
 * Searches and stores information about plugin bundles.
 * Options:
 *   paths - array of locations where to search for 'plugins' folder
 *           and 'camunda-modeler.js' descriptors
 *
 * @param {Object} options
 */
function PluginsManager(options) {
  this.options = options || {};

  this.plugins = findPlugins(options.paths)
    .map(p => {
      let descriptor = require(p);
      let pluginPath = path.dirname(p);

      let plugin = {};

      if (descriptor.style) {
        plugin.style = path.join(pluginPath, descriptor.style);
      }

      if (descriptor.script) {
        plugin.script = path.join(pluginPath, descriptor.script);
      }

      if (descriptor.menu) {
        plugin.menu = descriptor.menu;
      }

      return plugin;
    });
}

PluginsManager.prototype.getPlugins = function() {
  return this.plugins;
};

function findPlugins(paths) {

  var plugins = [];

  paths.forEach(path => {
    var globOptions = {
      cwd: path,
      nodir: true,
      realpath: true
    };

    var locationPlugins = glob.sync('plugins/**/camunda-modeler.js', globOptions);

    plugins = plugins.concat(locationPlugins);
  });

  return plugins;
}

module.exports = PluginsManager;