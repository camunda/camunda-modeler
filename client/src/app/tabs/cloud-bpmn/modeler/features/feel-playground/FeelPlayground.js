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

const ENCODER = new TextEncoder();

const PERSISTENCE_KEY = 'feelPlayground';
const PERSISTENCE_VERSION = 1;

export const MAX_CONTEXT_SIZE = 16 * 1024;

/**
 * Holds the FEEL playground configuration and the evaluation contexts entered
 * by the user.
 *
 * The configuration depends on the cluster connection and therefore changes
 * independently of the popup lifecycle. The popup subscribes to it instead of
 * receiving it as a prop.
 *
 * Contexts are persisted per file so they survive restarts. They are a
 * convenience cache: the expression itself lives in the diagram, so losing a
 * context is never fatal.
 */
export default class FeelPlayground {

  /**
   * @param {import('../../../../../../remote/Config').default} [config] omitted
   * in tests, in which case contexts are kept in memory only
   */
  constructor(config = null) {
    this._config = EMPTY_CONFIG;
    this._contexts = new Map();
    this._listeners = new Set();
    this._contextListeners = new Set();
    this._file = null;
    this._appConfig = config;
    this._dirty = false;

    this.getConfig = this.getConfig.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.subscribeContext = this.subscribeContext.bind(this);
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
    this._dirty = true;

    this._contextListeners.forEach(listener => listener());
  }

  /**
   * @param {File} file
   */
  async setFile(file) {
    this._file = file;

    const path = file?.path;

    if (!path || !this._appConfig) {
      return;
    }

    try {
      const persisted = await this._appConfig.getForFile(file, PERSISTENCE_KEY);

      // the file changed while we were loading
      if (this._file?.path !== path) {
        return;
      }

      const contexts = isPersistedContexts(persisted) ? persisted.contexts : {};

      let restored = false;

      Object.entries(contexts).forEach(([ key, value ]) => {

        // a context entered while loading wins over the persisted one
        if (typeof value === 'string' && !this._contexts.has(key)) {
          this._contexts.set(key, value);

          restored = true;
        }
      });

      if (restored) {
        this._contextListeners.forEach(listener => listener());
      }
    } catch (error) {
      console.error('Failed to load FEEL playground contexts:', error);
    }

    // contexts entered before the file had a path
    await this.saveContexts();
  }

  subscribe(listener) {
    this._listeners.add(listener);

    return () => this._listeners.delete(listener);
  }

  subscribeContext(listener) {
    this._contextListeners.add(listener);

    return () => this._contextListeners.delete(listener);
  }

  /**
   * Persist the contexts entered since the last save. Called when the popup
   * closes; saving per keystroke would rewrite the whole configuration file.
   */
  async saveContexts() {
    if (!this._dirty || !this._file?.path || !this._appConfig) {
      return;
    }

    const contexts = {};

    this._contexts.forEach((value, key) => {

      // oversized contexts stay usable in memory, but out of the config file
      if (ENCODER.encode(value).byteLength <= MAX_CONTEXT_SIZE) {
        contexts[key] = value;
      }
    });

    this._dirty = false;

    try {
      await this._appConfig.setForFile(this._file, PERSISTENCE_KEY, {
        version: PERSISTENCE_VERSION,
        contexts
      });
    } catch (error) {
      this._dirty = true;
      console.error('Failed to save FEEL playground contexts:', error);
    }
  }
}


// helpers //////////

function isPersistedContexts(value) {
  return value?.version === PERSISTENCE_VERSION
    && value.contexts
    && typeof value.contexts === 'object'
    && !Array.isArray(value.contexts);
}
