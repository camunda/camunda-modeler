'use strict';

const path = require('path');
const glob = require('glob');


/**
 * Searches, validates and stores information about plugins.
 *
 * @param {Object} [options] - Options
 * @param {Array}  [options.paths] - Paths to search.
 */
class Plugins {
  constructor(options = {}) {
    const paths = options.paths || [];

    console.log('plug-ins: search paths', paths);

    const pluginPaths = findPluginPaths(paths);

    console.log('plug-ins: found plug-in paths', pluginPaths);

    this.plugins = this._createPlugins(pluginPaths);

    console.log('plug-ins: registered', Object.keys(this.plugins));
  }

  _createPlugins(pluginPaths) {
    return pluginPaths.reduce((plugins, pluginPath) => {

      // don't let broken plug-ins bring down the modeler
      // instantiation; skip them and log a respective error
      try {
        console.log(`plugins: loading ${pluginPath}`);

        const base = path.dirname(pluginPath);

        const {
          name,
          style,
          script,
          menu
        } = require(pluginPath);

        if (!name) {
          throw new Error('plug-in descriptor is missing <name>');
        }

        if (name in plugins) {
          throw new Error(`plug-in with name ${name} already registered via ${plugins[name].pluginPath}`);
        }

        const plugin = {
          name,
          base,
          pluginPath
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
          const menuPath = path.join(base, menu);

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
          `plugins: failed to load ${pluginPath}`,
          error
        );
      }

      return plugins;
    }, {});
  }

  getPluginBase(pluginName) {
    const plugin = this.plugins[pluginName];

    return plugin && plugin.base;
  }

  getAll() {
    return this.plugins;
  }

  getAssetPath(url) {
    // accept app-plugins:/// for sake of backwards compatibility
    const match = /^app-plugins:\/\/\/?([^/]+)(.*)$/.exec(url);

    if (match) {

      const pluginName = match[1];
      const assetPath = match[2];

      const base = this.getPluginBase(pluginName);

      if (base) {
        return `file://${path.resolve(base + assetPath)}`;
      }
    }

    return null;
  }
}

// helpers //////////

/**
 * Find plug-ins under the given search paths.
 *
 * @param  {Array<String>} paths
 *
 * @return {Array<String>} plug-in paths
 */
function findPluginPaths(paths) {

  return paths.reduce((pluginPaths, searchPath) => {

    const foundPaths = glob.sync('plugins/*/index.js', {
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
