/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { filter } from 'min-dash';

import {
  Modal
} from '../app/primitives';

import { Fill } from '../app/slot-fill';

import React, * as ReactExports from 'react';


const PLUGINS_PROTOCOL = 'app-plugins://';

export default class Plugins {

  constructor(appPlugins) {
    this.appPlugins = appPlugins;
  }

  /**
   * Load all plugins by creating either HTML <link> or <script> tag.
   */
  loadAll() {

    const appPlugins = this.getAppPlugins();

    const stylePlugins = filter(appPlugins, appPlugin => appPlugin.style),
          scriptPlugins = filter(appPlugins, appPlugin => appPlugin.script);

    // load style plugins
    stylePlugins.forEach(this._loadStylePlugin);

    // load script plugins
    return Promise.all(scriptPlugins.map(this._loadScriptPlugin));
  }

  /**
   * Binds helpers to the given global.
   */
  bindHelpers(global) {

    global.react = ReactExports;

    global.react.React = React;

    global.components = {
      Fill,
      Modal
    };

    global.getModelerDirectory = () => {
      throw new Error('not implemented in Camunda Modeler >= 3.0.0');
    };

    global.getPluginsDirectory = () => {
      console.error(
        new Error(
          'The helper getPluginsDirectory() is deprecated and future versions of the app will remove it. ' +
          'Switch to links of the form with <app-plugins://{name}/{path-to-resource}> to refer to bundled plug-in resources.'
        )
      );

      return PLUGINS_PROTOCOL;
    };

  }

  /**
   * Get plugins of type.
   *
   * @param {string} type - Plugin type.
   *
   * @returns {Array}
   */
  get(type) {
    return this.getClientPlugins()
      .filter(registration => registration.type === type)
      .map(registration => registration.plugin);
  }

  /**
   * Load style plugin by creating HTML <link> tag.
   *
   * @param {Object} stylePlugin - Style plugin.
   * @param {string} stylePlugin.style - Path to stylesheet.
   */
  _loadStylePlugin(stylePlugin) {
    const { style } = stylePlugin;

    const styleTag = document.createElement('link');

    styleTag.href = style;
    styleTag.rel = 'stylesheet';

    document.head.appendChild(styleTag);
  }

  /**
   * Load script plugin by creating HTML <script> tag.
   *
   * @param {Object} scriptPlugin - Script plugin.
   * @param {string} scriptPlugin.script - Path to script.
   */
  _loadScriptPlugin(scriptPlugin) {
    const { name, script } = scriptPlugin;

    return new Promise(resolve => {
      const scriptTag = document.createElement('script');

      scriptTag.src = script;
      scriptTag.type = 'text/javascript';
      scriptTag.async = false;
      scriptTag.onload = resolve;
      scriptTag.dataset.name = name;

      document.head.appendChild(scriptTag);
    });
  }

  /**
   * Get all previously registered plugins. Plugins can register themselves using:
   * https://github.com/camunda/camunda-modeler-plugin-helpers
   *
   * @returns {Array}
   */
  getClientPlugins() {
    return window.plugins || [];
  }

  getAppPlugins() {
    return this.appPlugins;
  }

}
