/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { assign } from 'min-dash';

class CommandStack {
  constructor() {
    this._stackIdx = -1;
    this._maxStackIdx = this._stackIdx;
  }

  execute(commands) {
    this._stackIdx += commands;
    this._maxStackIdx = this._stackIdx;
  }

  undo() {
    if (this.canUndo()) {
      this._stackIdx--;
    }
  }

  redo() {
    if (this.canRedo()) {
      this._stackIdx++;
    }
  }

  canRedo() {
    return this._stackIdx < this._maxStackIdx;
  }

  canUndo() {
    return this._stackIdx > -1;
  }
}

class PropertiesPanel {
  attachTo() {}

  detach() {}
}


class Viewer {

  constructor(xml, modules, { type } = { type: 'drd' }) {
    this.modules = assign(this._getDefaultModules(), modules);

    this.xml = xml;
    this.type = type;
  }

  _getDefaultModules() {
    return {
      eventBus: {
        fire() {}
      },
      canvas: {
        resized() {}
      },
      commandStack: new CommandStack(),
      propertiesPanel: new PropertiesPanel(),
      selection: {
        get() {
          return [];
        },
        hasSelection() {
          return false;
        }
      },
      sheet: {
        resized() {}
      }
    };
  }

  saveSVG(done) {

    if (this.xml === 'export-as-error') {
      return done(new Error('failed to save svg'));
    }

    return done(null, '<svg />');
  }

  get(moduleName, strict) {
    const module = this.modules[moduleName];

    if (this.type !== 'drd' && moduleName === 'propertiesPanel' && strict === false) {
      return null;
    }

    if (module) {
      return module;
    }

    if (strict === false) {
      throw new Error(`service not provided: <${moduleName}>`);
    }

    return null;
  }
}


export default class Modeler {

  constructor(modules = {}) {
    this.modules = modules;

    this.xml = null;

    this.viewer = null;

    this.listeners = {};
  }

  importXML(xml, options, done) {

    if (typeof options !== 'object') {
      done = options;
    }

    this.xml = xml;

    this.viewer = new Viewer(this.xml, this.modules, this.activeView);

    const error = xml === 'import-error' ? new Error('error') : null;

    const warnings = xml === 'import-warnings' ? [ 'warning' ] : [];

    done && done(error, warnings);
  }

  getActiveView() {
    return this.activeView || { type: 'drd' };
  }

  getActiveViewer() {
    return this.viewer || new Viewer(this.xml, this.modules, this.activeView);
  }

  _getViewer() {
    return this.viewer || new Viewer(this.xml, this.modules, this.activeView);
  }

  saveXML(options, done) {

    const xml = this.xml;

    if (xml === 'export-error') {
      return done(new Error('failed to save xml'));
    }

    return done(null, xml);
  }

  _getInitialView() {
    return { type: 'drd' };
  }

  getView(element) {
    return { type: 'drd', element };
  }

  getViews() {
    return [
      { type: 'drd' }
    ];
  }

  open(view) {
    this.activeView = view;
  }

  attachTo() {}

  detach() {}

  attachOverviewTo() {}

  detachOverview() {}

  on(event, priority, callback) {
    if (!callback) {
      callback = priority;
    }

    if (!this.listeners[ event ]) {
      this.listeners[ event ] = [];
    }

    this.listeners[ event ].push(callback);
  }

  off() {}

  _emit(event) {
    if (this.listeners[ event ]) {
      this.listeners[ event ].forEach(callback => callback());
    }
  }

  getStackIdx() {
    const viewer = this.viewer || new Viewer(this.xml, this.modules, this.activeView);

    const commandStack = viewer.get('commandStack', false);

    return commandStack._stackIdx;
  }

  getDefinitions() {
    return this.xml ? {} : null;
  }

}

Modeler.prototype._modules = [];
