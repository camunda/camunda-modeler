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

export const DELAYS = {
  LONG: 5000, // 5s interval if no config change
  SHORT: 1000 // 1s delay if config change
};

export default class ConnectionChecker extends EventEmitter {
  constructor(zeebeAPI) {
    super();

    this._zeebeAPI = zeebeAPI;

    this._checkInterval = null;
    this._checkTimeout = null;
    this._config = null;
    this._lastResult = null;
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

    this._checkInterval = null;
    this._checkTimeout = null;
  }

  async _check() {
    if (!this._config) {
      const result = {
        success: false,
        reason: CONNECTION_CHECK_ERROR_REASONS.NO_CONFIG,
        error: new Error(CONNECTION_CHECK_ERROR_REASONS.NO_CONFIG)
      };

      this._lastResult = result;

      this.emit('connectionCheck', result);

      return;
    }

    try {
      const { endpoint } = this._config;

      const result = await this._zeebeAPI.checkConnection(endpoint);

      this._lastResult = result;

      this.emit('connectionCheck', result);
    } catch (error) {
      const result = {
        success: false,
        error
      };

      this._lastResult = result;

      this.emit('connectionCheck', result);
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