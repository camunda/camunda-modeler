/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/**
 * Registry that maps action names to handler functions.
 * Replaces the if-chain in App#triggerAction with a declarative dispatch model.
 */
export default class ActionRegistry {

  constructor() {
    this._handlers = new Map();
  }

  /**
   * Register a handler for an action.
   *
   * @param {string} action - The action name.
   * @param {function} handler - The handler function receiving (options) and returning a result.
   */
  register(action, handler) {
    this._handlers.set(action, handler);
  }

  /**
   * Register multiple actions at once.
   *
   * @param {Object.<string, function>} actions - Map of action name to handler.
   */
  registerAll(actions) {
    for (const [ action, handler ] of Object.entries(actions)) {
      this._handlers.set(action, handler);
    }
  }

  /**
   * Check if the registry has a handler for the given action.
   *
   * @param {string} action
   * @returns {boolean}
   */
  has(action) {
    return this._handlers.has(action);
  }

  /**
   * Dispatch an action. Returns the handler's return value, or undefined if not found.
   *
   * @param {string} action
   * @param {*} options
   * @returns {*}
   */
  dispatch(action, options) {
    const handler = this._handlers.get(action);

    if (handler) {
      return handler(options);
    }

    return undefined;
  }
}
