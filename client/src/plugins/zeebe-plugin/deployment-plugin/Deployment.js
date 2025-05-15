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
 * @typedef {import('./types.d.ts').DeploymentConfig} DeploymentConfig
 * @typedef {import('./types.d.ts').DeploymentResult} DeploymentResult
 * @typedef {import('./types.d.ts').Endpoint} Endpoint
 * @typedef {import('./types.d.ts').ResourceConfig} ResourceConfig
 * @typedef {import('./types.d.ts').ResourceConfigs} ResourceConfigs
 */

import EventEmitter from 'events';

import { omit } from 'min-dash';

import { generateId } from '../../../util';

import { AUTH_TYPES, TARGET_TYPES } from '../../../remote/ZeebeAPI';

export const CONFIG_KEYS = {
  CONFIG: 'zeebe-deployment-tool',
  ENDPOINTS: 'zeebeEndpoints'
};

export const DEFAULT_CREDENTIALS = {
  basicAuthPassword: '',
  basicAuthUsername: '',
  clientId: '',
  clientSecret: '',
  camundaCloudClientId: '',
  camundaCloudClientSecret: ''
};

export const DEFAULT_ENDPOINT = {
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

export default class Deployment extends EventEmitter {

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
   * Deploy resources with given configuration. For each resource a file path
   * and type must be provided.
   *
   * @emits { {
   *   deploymentResult: DeploymentResult,
   *   endpoint: Endpoint,
   *   gatewayVersion: string,
   * } } [deployed]
   *
   * @example
   *
   * ```javascript
   * await deployment.deploy([{
   *   path: '/path/to/file.bpmn',
   *   type: 'bpmn'
   * }], config);
   * ```
   *
   * @param {ResourceConfig|ResourceConfigs} resourceConfigs
   * @param {DeploymentConfig} config
   *
   * @returns {Promise<DeploymentResult>}
   */
  async deploy(resourceConfigs, config) {
    resourceConfigs = Array.isArray(resourceConfigs) ? resourceConfigs : [ resourceConfigs ];

    const {
      deployment,
      endpoint
    } = config;

    const { tenantId } = deployment;

    const deploymentResult = await this._zeebeAPI.deploy({
      endpoint,
      resourceConfigs,
      tenantId
    });

    const gatewayVersion = await this.getGatewayVersion(endpoint);

    this.emit('deployed', {
      deploymentResult,
      endpoint,
      gatewayVersion
    });

    return deploymentResult;
  }

  /**
   * Get configuration for given file.
   *
   * @param {File} file
   *
   * @returns {Promise<DeploymentConfig>}
   */
  async getConfigForFile(file) {
    const {
      deployment = {},
      endpointId = null
    } = await this._config.getForFile(file, CONFIG_KEYS.CONFIG, {});

    const defaultEndpoint = await this.getDefaultEndpoint();

    const endpoint = await this.getEndpoint(endpointId) || {};

    return {
      deployment,
      endpoint: {
        ...defaultEndpoint,
        ...endpoint
      }
    };
  }

  /**
   * Set configuration for given file.
   *
   * @param {File} file
   * @param {DeploymentConfig} config
   *
   * @returns {Promise<void>}
   */
  async setConfigForFile(file, config) {
    let {
      deployment = {},
      endpoint = {}
    } = config;

    const {
      id,
      rememberCredentials
    } = endpoint;

    if (!rememberCredentials) {
      endpoint = removeCredentials(endpoint);
    }

    await this.setEndpoint(endpoint);

    return this._config.setForFile(file, CONFIG_KEYS.CONFIG, {
      deployment,
      endpointId: id
    });
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

    // backwards compatibility
    // see https://github.com/camunda/camunda-modeler/pull/2390
    // TODO: remove in the future
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
   * @returns {Promise<Endpoint|null>}
   */
  async getEndpoint(id) {
    const endpoints = await this.getEndpoints();

    return endpoints.find(endpoint => endpoint.id === id) || null;
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
  async setEndpoint(endpoint) {
    const endpoints = await this.getEndpoints();

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
    return this._config.set(CONFIG_KEYS.ENDPOINTS, endpoints);
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

const CREDENTIALS = [
  'camundaCloudClientId',
  'camundaCloudClientSecret',
  'clientId',
  'clientSecret'
];

/**
 * Remove credentials from endpoint.
 *
 * @param {Endpoint} endpoint
 *
 * @returns {Endpoint}
 */
export function removeCredentials(endpoint) {
  return omit(endpoint, CREDENTIALS);
}