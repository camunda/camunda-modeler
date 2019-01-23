'use strict';

const path = require('path');
const glob = require('glob');


/**
 * Searches, validates and stores information about plugin bundles.
 *
 * @param {Object} [options]
 * @param {Array}  options.path locations where to search for 'plugins'
 *                              folder and 'camunda-modeler.js' descriptors
 */
function Plugins(options = {}) {

  const paths = options.paths || [];

  console.log('plugins: search paths', paths);

  this.plugins = findPluginEntries(paths).reduce((plugins, entry) => {

    // don't let broken plug-ins bring down the modeler
    // instantiation; skip them and log a respective error
    try {
      console.log(`plugins: loading ${entry}`);

      const base = path.dirname(entry);

      const {
        name,
        style,
        script,
        menu
      } = require(entry);

      if (!name) {
        throw new Error('plug-in descriptor is missing <name>');
      }

      if (name in plugins) {
        throw new Error(`plug-in with name ${name} already registered via ${plugins[name].entry}`);
      }

      const plugin = {
        name,
        base,
        entry
      };

      if (style) {
        const stylePath = path.join(base, style);
        const styleFiles = glob.sync(stylePath);

        if (!styleFiles.length) {
          plugin.error = true;
        } else {
          plugin.style = stylePath;
        }
      }

      if (script) {
        const scriptPath = path.join(base, script);
        const scriptFiles = glob.sync(scriptPath);

        if (!scriptFiles.length) {
          plugin.error = true;
        } else {
          plugin.script = scriptPath;
        }
      }

      if (menu) {
        var menuPath = path.join(base, menu);

        try {
          plugin.menu = require(menuPath);
        } catch (error) {
          console.error(
            `plugins: failed to load menu extension ${menuPath}`,
            error
          );

          plugin.error = true;
        }
      }

      return {
        ...plugins,
        [name]: plugin
      };
    } catch (error) {
      console.error(
        `plugins: failed to load ${entry}`,
        error
      );
    }

    return plugins;
  }, {});

  console.log('plugins: registered', Object.keys(this.plugins));
}

Plugins.prototype.getPlugins = function() {
  return this.plugins;
};


/**
 * Find plug-ins under the given search paths.
 *
 * @param  {Array<String>} paths
 *
 * @return {Array<String>} plug-in paths
 */
function findPluginEntries(paths) {

  return paths.reduce((pluginPaths, searchPath) => {

    var foundPaths = glob.sync('plugins/*/index.js', {
      cwd: searchPath,
      nodir: true,
      realpath: true
    });

    return [
      ...pluginPaths,
      ...foundPaths
    ];
  }, []);
}

module.exports = Plugins;
