/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import BpmnModdle from 'bpmn-moddle';

import { assign } from 'min-dash';

const moddle = new BpmnModdle();


export class CommandStack {
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

  setLayout() {}
}

class Linting {
  constructor(options = {}) {
    this._isActive = options.active;
  }

  activate() {
    this._isActive = true;
  }

  deactivate() {
    this._isActive = false;
  }

  isActive() {
    return this._isActive;
  }

  setErrors() {}

  showError() {}
}

class Selection {
  constructor() {
    this._selectedElements = [];
  }

  get() {
    return this._selectedElements;
  }

  select(elements) {
    this._selectedElements = elements;
  }
}

export default class Modeler {
  constructor(options = {}) {
    this.options = options;

    this.modules = assign(this._getDefaultModules(options), options.modules || {});

    this.additionalModules = options.additionalModules || [];

    this.xml = null;

    this.listeners = {};
  }

  _getDefaultModules(options = {}) {
    return {
      injector: {
        get() {}
      },
      eventBus: {
        on() {},
        off() {},
        fire() {}
      },
      canvas: {
        getRootElement() {},
        resized() {},
        isFocused() { return true; },
        restoreFocus() {},
        focus() {}
      },
      clipboard: {
        isEmpty() {}
      },
      commandStack: new CommandStack(),
      elementTemplatesLoader: {
        setTemplates() {}
      },
      elementTemplates: {
        setEngines() {},
        getEngines() {}
      },
      minimap: {
        toggle() {}
      },
      grid: {
        toggle() {}
      },
      modeling: {
        updateModdleProperties() {}
      },
      propertiesPanel: new PropertiesPanel(),
      selection: new Selection(),
      linting: new Linting(options.linting)
    };
  }

  importXML(xml) {
    this.xml = xml;

    const error = xml === 'import-error' ? new Error('error') : null;

    const warnings = xml === 'import-warnings' ? [ 'warning' ] : [];

    return new Promise((resolve, reject) => {
      if (error) {
        error.warnings = warnings;

        return reject(error);
      }

      if (warnings.length) {
        return resolve({ warnings });
      }

      moddle.fromXML(xml).then(({ rootElement }) => {
        this.definitions = rootElement;

        resolve({ warnings });
      }).catch((error) => {
        reject(error);
      });
    });
  }

  saveXML(options) {

    const xml = this.xml;

    // commands may be executed during export
    this.get('commandStack').execute(1);

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

  off(event, callback) {
    const listeners = this.listeners[ event ];
    if (!listeners) {
      return;
    }

    this.listeners[ event ] = listeners.filter(l => l !== callback);
  }

  _emit(event, data) {
    if (this.listeners[ event ]) {
      this.listeners[ event ].forEach(callback => callback(data));
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
    return this.definitions;
  }

  invoke() {}
}

Modeler.prototype._modules = [];
