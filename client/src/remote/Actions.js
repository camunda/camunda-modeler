/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

export default class Actions {
  constructor() {
    this._actions = {};
  }

  hasAction(action) {
    const callback = this._actions[ action ];

    return !!callback;
  }

  triggerAction(action, ...args) {
    if (!this.hasAction(action)) {
      throw new Error('action not found');
    }

    const callback = this._actions[ action ];

    return callback(...args);
  }

  registerAction(action, callback) {
    if (this.hasAction(action)) {
      throw new Error('action already registered');
    }

    this._actions[ action ] = callback;
  }

  deregisterAction(action) {
    if (!this.hasAction(action)) {
      throw new Error('action not found');
    }

    delete this._actions[ action ];
  }
}