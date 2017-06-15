'use strict';

var path = require('path'),
    glob = require('glob');

/**
 * Searches, validates and stores information about plugin bundles.
 *
 * @param {Object} options
 * @param {Array}  options.path locations where to search for 'plugins'
 *                              folder and 'camunda-modeler.js' descriptors
 */
function Plugins(options) {
  this.options = options || {};

  this.plugins = findPlugins(options.paths)
    .map(p => {
      let descriptor = require(p);
      let pluginPath = path.dirname(p);

      let plugin = {};

      plugin.name = descriptor.name || '<unknown plugin>';

      if (descriptor.style) {
        var stylePath = path.join(pluginPath, descriptor.style);
        var styleFiles = glob.sync(stylePath);

        if (!styleFiles.length) {
          plugin.error = true;
        } else {
          plugin.style = stylePath;
        }
      }

      if (descriptor.script) {
        var scriptPath = path.join(pluginPath, descriptor.script);
        var scriptFiles = glob.sync(scriptPath);

        if (!scriptFiles.length) {
          plugin.error = true;
        } else {
          plugin.script = scriptPath;
        }
      }

      if (descriptor.menu) {
        var menuPath = path.join(pluginPath, descriptor.menu);

        try {
          plugin.menu = require(menuPath);
        } catch (e) {
          console.error(e);
          plugin.error = true;
        }
      }

      return plugin;
    });
}

Plugins.prototype.getPlugins = function() {
  return this.plugins;
};

function findPlugins(paths) {

  var plugins = [];

  paths.forEach(path => {
    var globOptions = {
      cwd: path,
      nodir: true,
      realpath: true,
      ignore: 'plugins/**/node_modules/**/index.js'
    };

    var locationPlugins = glob.sync('plugins/**/index.js', globOptions);

    plugins = plugins.concat(locationPlugins);
  });

  return plugins;
}

module.exports = Plugins;
