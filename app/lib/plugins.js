/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const path = require('path');

const log = require('./log')('app:plugins');

const { globFiles } = require('./util/files');

const PLUGINS_PATTERN = 'plugins/*/index.js';

// accept app-plugins:/// for sake of backwards compatibility
const PLUGINS_PROTOCOL_REGEX = /^app-plugins:\/\/\/?([^/]+)(.*)$/;

/**
 * Searches, validates and stores information about plugins.
 *
 * @param {Object} [options] - Options
 * @param {Array}  [options.paths] - Paths to search.
 */
class Plugins {

  constructor(options = {}) {

    const searchPaths = options.paths || [];

    if (!searchPaths.length) {
      this.plugins = [];

      return;
    }

    log.info('searching for %s in paths %O', PLUGINS_PATTERN, searchPaths);

    const pluginPaths = globFiles(PLUGINS_PATTERN, {
      searchPaths
    });

    log.info('found plug-in entries %O', pluginPaths);

    this.plugins = this._createPlugins(pluginPaths);

    log.info('registered %O', Object.keys(this.plugins));
  }

  _createPlugins(pluginPaths) {
    return pluginPaths.reduce((plugins, pluginPath) => {

      // don't let broken plug-ins bring down the modeler
      // instantiation; skip them and log a respective error
      try {
        log.info('loading %s', pluginPath);

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
          const stylePath = path.posix.join(base, style);

          const styleFiles = globFiles(stylePath);

          if (!styleFiles.length) {
            plugin.error = true;
          } else {
            plugin.style = stylePath;
          }
        }

        if (script) {
          const scriptPath = path.posix.join(base, script);

          const scriptFiles = globFiles(scriptPath);

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
            log.error('failed to load menu extension %s', menuPath, error);

            plugin.error = true;
          }
        }

        return {
          ...plugins,
          [name]: plugin
        };
      } catch (error) {
        log.error('failed to load %s', pluginPath, error);
      }

      return plugins;
    }, {});
  }

  getPluginBase(pluginName) {
    const plugin = this.plugins[pluginName];

    return plugin && plugin.base;
  }

  /**
   * Creates an array containing all plugins.
   *
   * @returns {Array<Plugin>}
   */
  getAll() {
    return Object.values(this.plugins);
  }

  getAssetPath(url) {
    const match = PLUGINS_PROTOCOL_REGEX.exec(url);

    if (match) {

      const pluginName = match[1];

      // we accept only slash as a separator
      const assetPath = path.posix.normalize(match[2]);

      const base = this.getPluginBase(pluginName);

      if (base) {
        return `file://${path.join(base, assetPath)}`;
      }
    }

    return null;
  }

}

module.exports = Plugins;
