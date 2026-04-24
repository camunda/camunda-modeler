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
 * Framework-agnostic state container.
 *
 * Currently bridges to React's setState for rendering, but presents
 * a clean interface that services depend on instead of raw callbacks.
 * This decouples services from the UI framework and enables standalone
 * testing without a React component.
 *
 * @param {object} options
 * @param {function} options.setState - State update function (e.g. React's setState).
 * @param {function} options.getState - Returns current state snapshot.
 */
export default class AppStore {

  constructor({ setState, getState }) {

    if (typeof setState !== 'function') {
      throw new Error('AppStore requires a setState function');
    }

    if (typeof getState !== 'function') {
      throw new Error('AppStore requires a getState function');
    }

    this._setState = setState;
    this._getState = getState;
  }

  /**
   * Update state. Accepts a patch object or an updater function
   * `(state) => patch`. Optional callback fires after the update.
   *
   * @param {object|function} updater - State patch or updater function.
   * @param {function} [callback] - Called after the state is updated.
   */
  setState(updater, callback) {
    this._setState(updater, callback);
  }

  /**
   * Read the current state snapshot.
   *
   * @returns {object} Current state.
   */
  getState() {
    return this._getState();
  }
}
