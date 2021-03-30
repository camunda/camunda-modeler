/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

export function createFormEditor({ schema }) {
  if (schema.importError) {
    throw new Error('error');
  }

  const listeners = {};

  return {
    getSchema() {
      return schema;
    },
    on(event, callback) {
      if (!listeners[ event ]) {
        listeners[ event ] = [];
      }

      listeners[ event ].push(callback);
    },
    off() {},
    _emit(event) {
      if (listeners[ event ]) {
        listeners[ event ].forEach(callback => callback());
      }
    }
  };
}