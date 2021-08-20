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

  getSchema() {
    return this.saveSchema();
  }

  saveSchema() {
    return this.schema;
  }
}