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
 * @typedef {import('@camunda8/sdk/dist/zeebe/types').DeployResourceResponse} DeployResourceResponse
 * @typedef {import('./types.d.ts').Endpoint} Endpoint
 * @typedef {import('./types.d.ts').ResourceConfig} ResourceConfig
 * @typedef {import('./types.d.ts').ResourceConfigs} ResourceConfigs
 */

import EventEmitter from 'events';

import { generateId } from '../../../util';

import { AUTH_TYPES } from '../shared/ZeebeAuthTypes';
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
   */
  constructor(config, zeebeAPI) {
    this._events = new EventEmitter();

    this._config = config;
    this._zeebeAPI = zeebeAPI;
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
   * Deploy resources with given configuration. For each resource a file path
   * and type must be provided.
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
   * @returns {Promise<{
   *   success: boolean,
   *   response: DeployResourceResponse
   * }>}
   */
  deploy(resourceConfigs, config) {
    resourceConfigs = Array.isArray(resourceConfigs) ? resourceConfigs : [ resourceConfigs ];

    const {
      deployment,
      endpoint
    } = config;

    if (endpoint.targetType === TARGET_TYPES.CAMUNDA_CLOUD && endpoint.camundaCloudClusterUrl) {
      endpoint.camundaCloudClusterId = getClusterId(endpoint.camundaCloudClusterUrl);
      endpoint.camundaCloudClusterRegion = getClusterRegion(endpoint.camundaCloudClusterUrl);
    }

    if (!endpoint.scope) {
      delete endpoint.scope;
    }

    if (endpoint.authType === AUTH_TYPES.NONE) {
      delete deployment.tenantId;
    }

    if (endpoint.targetType === TARGET_TYPES.SELF_HOSTED && !isHttpOrHttps(endpoint.contactPoint)) {
      endpoint.contactPoint = `http://${ endpoint.contactPoint }`;
    }

    const { tenantId } = deployment;

    return this._zeebeAPI.deploy({
      endpoint,
      resourceConfigs,
      tenantId
    });
  }

  /**
   * Get configuration for given file.
   *
   * @param {File} file
   *
   * @returns {Promise<DeploymentConfig>}
   */
  async getConfigForFile(file) {
    return this._config.getForFile(file, CONFIG_KEYS.CONFIG, {});
  }

  /**
   * Set configuration for given file.
   *
   * @param {File} file
   * @param {DeploymentConfig} config
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

/**
  * Get cluster ID from cluster URL.
  *
  * @example
  *
  * ```javascript
  * const clusterId = extractClusterId('https://xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.yyy-z.zeebe.example.io:443');
  *
  * console.log(clusterId); // 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
  * ```
  *
  * @param  {string} clusterURL
  *
  * @returns {string} clusterId
  */
function getClusterId(clusterURL) {
  const matches = clusterURL.match(/([a-z\d]+-){2,}[a-z\d]+/g);

  return matches ? matches[0] : null;
}


/**
 * Get cluster region from cluster URL.
 *
 * @example
 *
 * ```javascript
 * const clusterRegion = extractClusterRegion('https://xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.yyy-z.zeebe.example.io:443');
 *
 * console.log(clusterRegion); // 'yyy-z'
 * ```
 *
 * @param  {string} clusterURL
 *
 * @returns {string} clusterRegion
 */
function getClusterRegion(clusterURL) {
  const matches = clusterURL.match(/(?<=\.)[a-z]+-[\d]+/g);

  return matches ? matches[0] : null;
}

/**
 * Check if the URL is HTTP or HTTPS.
 *
 * @example
 *
 * ```javascript
 * let isHttpOrHttps = isHttpOrHttps('http://foo.com');
 * console.log(isHttpOrHttps); // true
 *
 * isHttpOrHttps = isHttpOrHttps('https://foo.com');
 * console.log(isHttpOrHttps); // true
 *
 * isHttpOrHttps = isHttpOrHttps('ftp://foo.com');
 * console.log(isHttpOrHttps); // false
 * ```
 *
 * @param {string} url
 *
 * @returns {boolean}
 */
function isHttpOrHttps(url) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch (error) {
    return false;
  }
}