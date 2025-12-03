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
 * @typedef {import('./types').StartInstanceConfig} StartInstanceConfig
 * @typedef {import('./types').StartInstanceResult} StartInstanceResult
 */

import EventEmitter from 'events';

import { isObject } from 'min-dash';

export const CONFIG_KEYS = {
  CONFIG: 'start-process-instance'
};

export const DEFAULT_VARIABLES = {};

export default class StartInstance extends EventEmitter {

  /**
   * @param {import('../../../remote/Config').default} config
   * @param {import('../../../remote/ZeebeAPI').default} zeebeAPI
   */
  constructor(config, zeebeAPI) {
    super();

    this._config = config;
    this._zeebeAPI = zeebeAPI;
  }

  /**
   * Start instance of process with given process ID and configuration.
   *
   * @param {string} processId
   * @param {string} processId
   * @param {StartInstanceConfig} config
   *
   * * @returns {Promise<StartInstanceResult>}
   */
  async startInstance(processId, config) {
    const {
      deployment,
      endpoint,
      variables = '{}',
      startInstructions,
      runtimeInstructions
    } = config;

    const { tenantId } = deployment;

    const startInstanceResult = await this._zeebeAPI.startInstance({
      endpoint,
      processId,
      tenantId,
      variables: parseVariables(variables),
      startInstructions,
      runtimeInstructions
    });

    this.emit('instanceStarted', {
      startInstanceResult,
      endpoint,
      processId,
      tenantId,
      variables: parseVariables(variables)
    });

    return startInstanceResult;
  }

  /**
   * Get configuration for given file.
   *
   * @param {File} file
   *
   * @returns {Promise<StartInstanceConfig>}
   */
  async getConfigForFile(file) {
    const { variables = JSON.stringify({}) } = await this._config.getForFile(file, CONFIG_KEYS.CONFIG, {});

    return {
      variables
    };
  }

  /**
   * Set configuration for given file.
   *
   * @param {File} file
   * @param {StartInstanceConfig} config
   *
   * @returns {Promise<void>}
   */
  setConfigForFile(file, config) {
    return this._config.setForFile(file, CONFIG_KEYS.CONFIG, config);
  }
}

function parseVariables(variables) {
  if (isObject(variables)) {
    return variables;
  }

  try {
    return JSON.parse(variables);
  } catch (e) {
    console.error('Failed to parse variables:', e);

    return {};
  }
}