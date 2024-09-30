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
  Modal,
  Overlay,
  Section,
  TextInput,
  ToggleSwitch
} from '../shared/ui';

import {
  WithCache,
  WithCachedState,
  CachedComponent
} from '../app/cached';

import {
  createTab
} from '../app/tabs/EditorTab';

import { Fill } from '../app/slot-fill';

import React, * as ReactExports from 'react';

import * as PropertiesPanel from '@bpmn-io/properties-panel';
import * as Preact from '@bpmn-io/properties-panel/preact';
import PreactCompat, * as PreactCompatExports from '@bpmn-io/properties-panel/preact/compat';
import * as PreactHooks from '@bpmn-io/properties-panel/preact/hooks';
import * as PreactJsxRuntime from '@bpmn-io/properties-panel/preact/jsx-runtime';
import * as BpmnJsPropertiesPanel from 'bpmn-js-properties-panel';
import * as DmnJsPropertiesPanel from 'dmn-js-properties-panel';


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

    return Promise.resolve()
      .then(() => Promise.all(stylePlugins.map(this._loadStylePlugin)))
      .then(() => Promise.all(scriptPlugins.map(this._loadScriptPlugin)));
  }

  /**
   * Binds helpers to the given global.
   */
  bindHelpers(global) {

    // React exports for the client plugins
    global.react = ReactExports;

    global.react.React = React;

    // Camunda Modeler UI components
    global.components = {
      Fill,
      Modal,
      Overlay,
      Section,
      TextInput,
      ToggleSwitch,
      CachedComponent,
      WithCache,
      WithCachedState,
      createTab
    };

    // deprecated helpers
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

    // vendored packages
    const vendor = global.vendor = {};

    // properties panel
    vendor.propertiesPanel = {
      common: PropertiesPanel,
      preact: {
        root: Preact,
        compat: {
          ...PreactCompatExports,
          default: PreactCompat
        },
        hooks: PreactHooks,
        jsxRuntime: PreactJsxRuntime
      },
      bpmn: BpmnJsPropertiesPanel,
      dmn: DmnJsPropertiesPanel
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

    return new Promise(resolve => {
      const styleTag = document.createElement('link');

      styleTag.href = style;
      styleTag.rel = 'stylesheet';
      styleTag.onload = resolve;

      document.head.appendChild(styleTag);
    });
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
