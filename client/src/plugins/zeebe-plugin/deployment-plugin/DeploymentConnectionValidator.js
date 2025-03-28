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
 * @typedef {import('./types').DeploymentConfig} DeploymentConfig
 * @typedef {import('./types').DeploymentConnectionValidationResult} DeploymentConnectionValidationResult
 * @typedef {import('../../../remote/ZeebeAPI').default} ZeebeAPI
 */

import EventEmitter from 'events';

const DELAY = 5000;

/**
 * Validates and monitors deployment connections.
 */
export default class DeploymentConnectionValidator extends EventEmitter {

  /**
   * @param {ZeebeAPI} zeebeAPI
   */
  constructor(zeebeAPI) {
    super();

    this._zeebeAPI = zeebeAPI;

    this._events = new EventEmitter();

    this._lastTimestamp = 0;
    this._interval = null;
  }

  /**
   * Validate connection.
   *
   * @param {DeploymentConfig} config
   *
   * @returns {Promise<DeploymentConnectionValidationResult>}
   */
  async validateConnection(config) {
    const { endpoint } = config;

    try {
      return await this._zeebeAPI.checkConnection(endpoint);
    } catch (error) {
      console.error('Failed to validate connection', error);

      return {
        success: false,
        reason: 'UNKNOWN'
      };
    }
  }

  /**
   * Start connection validation.
   *
   * @param {DeploymentConfig} config
   *
   * @returns {void}
   */
  startConnectionValidation(config) {
    this.stopConnectionValidation();

    this._interval = setInterval(async () => {
      const timestamp = this._lastTimestamp = Date.now();

      const { endpoint } = config;

      try {
        const result = await this._zeebeAPI.checkConnection(endpoint);

        if (timestamp === this._lastTimestamp) {
          this.emit('validate-connection-result', result);
        }
      } catch (error) {
        console.error('Failed to validate connection', error);

        this.emit('validate-connection-result', {
          success: false,
          reason: 'UNKNOWN'
        });
      }
    }, DELAY);
  }

  /**
   * Stop connection validation.
   *
   * @returns {void}
   */
  stopConnectionValidation() {
    if (this._interval) {
      clearInterval(this._interval);
    }
  }
}