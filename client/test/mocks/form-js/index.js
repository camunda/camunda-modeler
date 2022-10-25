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

import { domify } from 'min-dom';

import { CommandStack } from '../bpmn-js/Modeler';

export class FormEditor {
  constructor(options = {}) {
    this.options = options;

    this.modules = assign(this._getDefaultModules(), options.modules || {});

    this.schema = null;

    this.listeners = {};
  }

  _getDefaultModules() {
    return {
      eventBus: {
        fire() {}
      },
      commandStack: new CommandStack(),
      selection: {
        get() {
          return [];
        }
      }
    };
  }

  importSchema(schema) {
    this.schema = schema;

    const error = schema.importError ? new Error('error') : null;

    const warnings = [];

    return new Promise((resolve, reject) => {
      if (error) {
        error.warnings = warnings;

        return reject(error);
      }

      return resolve({ warnings });
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
    if (this.listeners[ event ]) {
      this.listeners[ event ] = this.listeners[ event ].filter(cb => cb !== callback);
    }
  }

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

  getSchema() {
    return this.saveSchema();
  }

  saveSchema() {
    return this.schema;
  }
}

export class FormPlayground {
  constructor(options = {}) {
    this.options = options;

    this._editor = new FormEditor(options);

    this._dataEditor = options.dataEditor || {
      getValue: () => null
    };

    this._form = options.form || {
      _getState: () => null
    };

    this._emitLayoutChanged = options.emitLayoutChanged;

    // mock playground DOM elements
    this._container = domify('<div class="forms-playground"></div>');
    this._container.appendChild(domify('<input class="cfp-data-container" />"'));
    this._container.appendChild(domify('<input class="cfp-preview-container" />"'));

    this.schema = null;

    this.listeners = {};
  }

  attachTo(parent) {
    parent.appendChild(this._container);
  }

  detach() {
    const parent = this._container.parentNode;
    parent && parent.removeChild(this._container);
  }

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
    if (this.listeners[ event ]) {
      this.listeners[ event ] = this.listeners[ event ].filter(cb => cb !== callback);
    }
  }

  emit(event, context) {
    if (this.listeners[ event ]) {
      this.listeners[ event ].forEach(callback => callback(context));
    }
  }

  get(moduleName) {
    return this._editor.get(moduleName);
  }

  getEditor() {
    return this._editor;
  }

  getForm() {
    return this._form;
  }

  getDataEditor() {
    return this._dataEditor;
  }

  getSchema() {
    return this.saveSchema();
  }

  saveSchema() {
    return this._editor.schema;
  }

  open() {
    this._emitLayoutChanged && this.emit('formPlayground.layoutChanged', {
      layout: {
        'form-preview': { open: true },
        'form-input': { open: true },
        'form-output': { open: true }
      }
    });
  }

  collapse() {
    this._emitLayoutChanged && this.emit('formPlayground.layoutChanged', {
      layout: {
        'form-preview': { open: false },
        'form-input': { open: false },
        'form-output': { open: false }
      }
    });
  }
}