/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import EventEmitter from 'events';
import { CONNECTION_CHECK_ERROR_REASONS } from './ConnectionCheckErrors';
import { validateConnection } from '../connection-manager-plugin/ConnectionValidator';

export const DELAYS = {
  LONG: 5000, // 5s interval if no config change
  SHORT: 1000 // 1s delay if config change
};

const ERROR_CHECK_ABORTED = 'CHECK_ABORTED';

export default class ConnectionChecker extends EventEmitter {
  constructor(zeebeAPI, name = 'default') {
    super();

    this._zeebeAPI = zeebeAPI;

    this._checkInterval = null;
    this._checkTimeout = null;
    this._config = null;
    this._lastResult = null;
    this._abortController = null;
    this._isChecking = false;
    this._name = name;
  }

  updateConfig(config, startChecking = true) {
    this._config = config;

    this._cancelCheck();

    this._checkTimeout = setTimeout(() => {
      this._check();

      if (startChecking) {
        this.startChecking();
      }
    }, DELAYS.SHORT);
  }

  getLastResult() {
    return this._lastResult;
  }

  _cancelCheck() {
    clearInterval(this._checkInterval);
    clearTimeout(this._checkTimeout);

    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }

    this._checkInterval = null;
    this._checkTimeout = null;
  }

  async _check() {
    if (this._isChecking) {
      return;
    }

    if (!this._config) {
      const result = {
        name: this._name,
        success: false,
        reason: CONNECTION_CHECK_ERROR_REASONS.NO_CONFIG,
        error: new Error(CONNECTION_CHECK_ERROR_REASONS.NO_CONFIG)
      };

      this._lastResult = result;

      this.emit('connectionCheck', result);

      return;
    }

    const { endpoint: connection } = this._config;

    const validationErrors = validateConnection(connection);
    if (Object.keys(validationErrors).length > 0) {
      const result = {
        name: this._name,
        success: false,
        reason: CONNECTION_CHECK_ERROR_REASONS.INVALID_CONFIGURATION,
        validationErrors
      };

      this._lastResult = result;

      this.emit('connectionCheck', result);

      return;
    }

    this._isChecking = true;
    const abortController = new AbortController();
    this._abortController = abortController;
    const { signal } = abortController;

    try {
      const abortPromise = new Promise((_, reject) => {
        signal.addEventListener('abort', () => {
          reject(new Error(ERROR_CHECK_ABORTED));
        });
      });

      // Race between the API call and abort signal
      const result = await Promise.race([
        this._zeebeAPI.checkConnection(connection),
        abortPromise
      ]);

      if (this._abortController !== abortController || signal.aborted) {
        throw new Error(ERROR_CHECK_ABORTED);
      }

      this._lastResult = result;

      this.emit('connectionCheck', { ...result, name: this._name });
    } catch (error) {

      // we don't want to emit the result of an aborted check, last result stays valid
      if (error.message === ERROR_CHECK_ABORTED || this._abortController !== abortController || signal.aborted) {
        return null;
      }

      const result = {
        name: this._name,
        success: false,
        error
      };

      this._lastResult = result;

      this.emit('connectionCheck', result);
    } finally {
      if (this._abortController === abortController) {
        this._abortController = null;
      }
      this._isChecking = false;
    }
  }

  startChecking() {
    if (this._checkInterval) {
      return;
    }

    this._check();

    this._checkInterval = setInterval(() => {
      this._check();
    }, DELAYS.LONG);
  }

  stopChecking() {
    this._cancelCheck();
  }
}