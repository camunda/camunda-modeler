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
 * @typedef {import(./types.d.ts).Config} Config
 * @typedef {import(./types.d.ts).Endpoint} Endpoint
 * @typedef {import(./types.d.ts).File} File
 */

import EventEmitter from 'events';

import { generateId } from '../../../util';

import { AUTH_TYPES } from './../shared/ZeebeAuthTypes';
import * as TARGET_TYPES from '../shared/ZeebeTargetTypes';

const CONFIG_KEYS = {
  CONFIG: 'zeebe-deployment-tool',
  ENDPOINTS: 'zeebeEndpoints'
};

const DEFAULT_CREDENTIALS = {
  basicAuthPassword: '',
  basicAuthUsername: '',
  clientId: '',
  clientSecret: '',
  camundaCloudClientId: '',
  camundaCloudClientSecret: ''
};

const DEFAULT_ENDPOINT = {
  ...DEFAULT_CREDENTIALS,
  audience: '',
  authType: AUTH_TYPES.NONE,
  camundaCloudClusterUrl: '',
  contactPoint: '',
  id: generateId(),
  oauthURL: '',
  rememberCredentials: false,
  targetType: TARGET_TYPES.CAMUNDA_CLOUD
};

export default class Deployment {

  /**
   * @param {import('../../../remote/Config').default} config
   * @param {import('../../../remote/ZeebeAPI').default} zeebeAPI
   * @param {import('./DeploymentPluginValidator').default} validator
   * @param {import('./ConnectionChecker').default} connectionChecker
   */
  constructor(config, zeebeAPI, validator, connectionChecker) {
    this._events = new EventEmitter();

    this._config = config;
    this._zeebeAPI = zeebeAPI;
    this._validator = validator;
    this._connectionChecker = connectionChecker;
  }

  /**
   * Register event listener.
   *
   * @param {string} event
   * @param {Function} listener
   */
  on(event, listener) {
    this._events.on(event, listener);
  }

  /**
   * Deregister event listener.
   *
   * @param {string} event
   * @param {Function} listener
   */
  off(event, listener) {
    this._events.off(event, listener);
  }

  /**
   * Deploy files with given configuration.
   *
   * @param {Array<File>|File} files
   * @param {Config} config
   *
   * @returns {Promise<void>}
   */
  deploy(files, config) {
    files = Array.isArray(files) ? files : [ files ];

    const {
      deployment: {
        name,
        tenantId
      },
      endpoint
    } = config;

    const zeebeAPI = this.props._getGlobal('zeebeAPI');

    return zeebeAPI.deploy({
      endpoint,
      files,
      name,
      tenantId
    });
  }

  /**
   * Check if can deploy by
   *
   * 1. Validating configuration
   * 2. Checking connection
   *
   * @param {Config} config
   *
   * @returns {Promise<boolean>}
   */
  async canDeploy(config) {
    const {
      deployment,
      endpoint
    } = config;

    if (!deployment || !endpoint) {
      return false;
    }

    const errors = this._validator.validateConfig(config);

    const configValid = !Object.keys(errors).length;

    if (!configValid) {
      return false;
    }

    const { connectionResult: { success } = {} } = await this._connectionChecker.check(config.endpoint);

    return success;
  }

  /**
   * Get configuration for given file.
   *
   * @param {File} file
   *
   * @returns {Promise<void>}
   */
  getConfigForFile(file) {
    return this._config.getForFile(file, CONFIG_KEYS.CONFIG, {});
  }

  /**
   * Set configuration for given file.
   *
   * @param {File} file
   * @param {Config} config
   *
   * @returns {Promise<void>}
   */
  setConfigForFile(file, config) {
    return this._config.setForFile(file, CONFIG_KEYS.CONFIG, config);
  }

  /**
   * Get default endpoint.
   *
   * @returns {Promise<Endpoint>}
   */
  async getDefaultEndpoint() {
    const endpoints = await this.getEndpoints();

    let endpoint = DEFAULT_ENDPOINT;

    if (endpoints.length) {
      endpoint = {
        ...DEFAULT_CREDENTIALS,
        ...endpoints[0]
      };
    }

    // ensure backwards compatibility
    if (endpoint.camundaCloudClusterId && !endpoint.camundaCloudClusterUrl) {
      endpoint.camundaCloudClusterUrl = `${ endpoint.camundaCloudClusterId }.bru-2.zeebe.camunda.io:443`;
    }

    return endpoint;
  }

  /**
   * Get endpoint with given ID.
   *
   * @param {string} id
   *
   * @returns {Promise<Endpoint>}
   */
  getEndpoint(id) {
    return this._config.get(CONFIG_KEYS.ENDPOINTS)[id];
  }

  /**
   * Get all endpoints.
   *
   * @returns {Promise<Array<Endpoint>>}
   */
  getEndpoints() {
    return this._config.get(CONFIG_KEYS.ENDPOINTS, []);
  }

  /**
   * Set endpoint with given ID.
   *
   * @param {Endpoint} endpoint
   *
   * @returns {Promise<void>}
   */
  setEndpoint(endpoint) {
    const endpoints = this.getEndpoints();

    const index = endpoints.findIndex(({ id }) => id === endpoint.id);

    if (index === -1) {
      endpoints.push(endpoint);
    } else {
      endpoints[index] = endpoint;
    }

    return this.setEndpoints(endpoints);
  }

  /**
   * Set all endpoints.
   *
   * @param {Array<Endpoint>} endpoints
   *
   * @returns {Promise<void>}
   */
  setEndpoints(endpoints) {
    return this.config.set(CONFIG_KEYS.ENDPOINTS, endpoints);
  }

  /**
   * @param {Endpoint} endpoint
   *
   * @returns {Promise<string>}
   */
  async getGatewayVersion(endpoint) {
    const { response } = await this._zeebeAPI.getGatewayVersion(endpoint);

    const { gatewayVersion } = response;

    return gatewayVersion;
  }
}