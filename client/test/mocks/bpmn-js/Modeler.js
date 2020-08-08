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
  constructor() {
    this._current = {
      element: {}
    };
  }

  attachTo() {}

  detach() {}

  update() {}
}

export default class Modeler {
  constructor(options = {}) {
    this.options = options;

    this.modules = assign(this._getDefaultModules(), options.modules || {});

    this.xml = null;

    this.listeners = {};
  }

  _getDefaultModules() {
    return {
      eventBus: {
        fire() {}
      },
      canvas: {
        resized() {}
      },
      clipboard: {
        isEmpty() {}
      },
      commandStack: new CommandStack(),
      elementTemplatesLoader: {
        setTemplates() {}
      },
      minimap: {
        toggle() {}
      },
      propertiesPanel: new PropertiesPanel(),
      selection: {
        get() {
          return [];
        }
      }
    };
  }

  importXML(xml) {
    this.xml = xml;

    let error = xml === 'import-error' ? new Error('error') : null;

    const warnings = xml === 'import-warnings' ? [ 'warning' ] : [];

    return new Promise((resolve, reject) => {
      if (error) {
        error.warnings = warnings;

        return reject(error);
      }

      return resolve({ warnings });
    });
  }

  saveXML(options) {

    const xml = this.xml;

    return new Promise((resolve, reject) => {

      if (xml === 'export-error') {
        return reject(new Error('failed to save xml'));
      }

      return resolve({ xml });
    });
  }

  saveSVG() {

    const xml = this.xml;

    return new Promise((resolve, reject) => {

      if (xml === 'export-as-error') {
        return reject(new Error('failed to save svg'));
      }

      return resolve({ svg: '<svg />' });
    });
  }

  attachTo() {}

  detach() {}

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

  get(moduleName) {
    const module = this.modules[moduleName];

    if (module) {
      return module;
    }

    throw new Error(`service not provided: <${moduleName}>`);
  }

  getDefinitions() {
    return this.xml ? {} : null;
  }

  invoke() {}
}

Modeler.prototype._modules = [];
