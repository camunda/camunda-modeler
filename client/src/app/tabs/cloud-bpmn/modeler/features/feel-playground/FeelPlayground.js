/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const EMPTY_CONFIG = {};

/**
 * Holds the FEEL playground configuration and the evaluation contexts entered
 * by the user.
 *
 * The configuration depends on the cluster connection and therefore changes
 * independently of the popup lifecycle. The popup subscribes to it instead of
 * receiving it as a prop.
 */
export default class FeelPlayground {
  constructor() {
    this._config = EMPTY_CONFIG;
    this._contexts = new Map();
    this._listeners = new Set();

    this.getConfig = this.getConfig.bind(this);
    this.subscribe = this.subscribe.bind(this);
  }

  /**
  * @return {{ onEvaluate?: Function, evaluationUnavailable?: string }}
   */
  getConfig() {
    return this._config;
  }

  setConfig(config) {
    this._config = config;

    this._listeners.forEach(listener => listener());
  }

  /**
   * @param {string} key
   * @return {string|undefined}
   */
  getContext(key) {
    return this._contexts.get(key);
  }

  setContext(key, context) {
    this._contexts.set(key, context);
  }

  subscribe(listener) {
    this._listeners.add(listener);

    return () => this._listeners.delete(listener);
  }
}
