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
 * @typedef {import('./Deployment').DeploymentConfig} DeploymentConfig
 * @typedef {import('./Deployment').DeploymentResult} DeploymentResult
 * @typedef {import('./Deployment').Endpoint} Endpoint
 * @typedef {import('./Deployment').ResourceConfig} ResourceConfig
 */

import EventEmitter from 'events';

import debug from 'debug';

import { generateId } from '../../util/index.js';

import { AUTH_TYPES, TARGET_TYPES } from '../../remote/ZeebeAPI.js';
import { SETTINGS_KEY_CONNECTIONS } from '../../plugins/zeebe-plugin/connection-manager-plugin/ConnectionManagerSettings.js';

export const CONFIG_KEYS = {
  CONFIG: 'zeebe-deployment-tool',
  CONNECTION_MANAGER: 'connection-manager',
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
  targetType: TARGET_TYPES.CAMUNDA_CLOUD
};

const log = debug('Deployment');

export default class Deployment extends EventEmitter {

  /**
   * @param {import('../../remote/Config').default} config
   * @param {import('../../remote/ZeebeAPI').default} zeebeAPI
   * @param {import('../../app/Settings').default} settings
   */
  constructor(config, zeebeAPI, settings) {
    super();

    this._config = config;
    this._settings = settings;
    this._zeebeAPI = zeebeAPI;

    this._resourcesProviders = [];
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
   * @param {ResourceConfig|ResourceConfig[]} resourceConfigs
   * @param {DeploymentConfig} config
   *
   * @returns {Promise<DeploymentResult>}
   */
  async deploy(resourceConfigs, config) {
    log('Starting deployment with resource configs:', resourceConfigs);

    resourceConfigs = Array.isArray(resourceConfigs) ? resourceConfigs : [ resourceConfigs ];

    // allow to add or remove resource configs through resources providers
    resourceConfigs = this._resourcesProviders.reduce((configs, getResourceConfigs) => {
      return getResourceConfigs(configs);
    }, resourceConfigs);

    log('Final resource configs:', resourceConfigs);

    if (!config || !config.endpoint) {
      return {
        success: false,
        response: {
          message: 'No connection configured.'
        }
      };
    }

    const {
      context,
      endpoint
    } = config;

    const deploymentResult = await this._zeebeAPI.deploy({
      endpoint,
      resourceConfigs
    });

    const gatewayVersion = await this.getGatewayVersion(endpoint);

    this.emit('deployed', {
      context,
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
   * @returns {Promise<DeploymentConfig|null>}
   */
  async getConfigForFile(file) {
    const {
      connectionId = null
    } = await this._config.getForFile(file, CONFIG_KEYS.CONNECTION_MANAGER, {});

    const endpoint = await this.getEndpoint(connectionId);
    if (!endpoint) {
      return null;
    }

    return { endpoint };
  }

  async setConnectionForFile(file, connectionId) {
    if (!file.path) {
      return await this._config.set(CONFIG_KEYS.CONNECTION_MANAGER, { connectionId });
    }

    return await this._config.setForFile(file, CONFIG_KEYS.CONNECTION_MANAGER, { connectionId });
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
    return this._settings.get(SETTINGS_KEY_CONNECTIONS);
  }


  /**
   * @param {Endpoint} endpoint
   *
   * @returns {Promise<string|null>}
   */
  async getGatewayVersion(endpoint) {
    const getGatewayVersionResult = await this._zeebeAPI.getGatewayVersion(endpoint);

    const {
      response,
      success
    } = getGatewayVersionResult;

    if (!success) {
      return null;
    }

    const { gatewayVersion } = response;

    return gatewayVersion;
  }

  /**
   * Register a resources provider.
   *
   * A resources provider is a function that receives an array of ResourceConfig objects
   * and returns a (possibly modified) array of ResourceConfig objects.
   *
   * Signature: (configs: ResourceConfig[]) => ResourceConfig[]
   *
   * Providers are applied in the order they are registered during deploy().
   * The return value of each provider must be an array.
   *
   * @param {(configs: ResourceConfig[]) => ResourceConfig[]} provider
   */
  registerResourcesProvider(provider) {
    this._resourcesProviders.push(provider);
  }

  /**
   * Unregister a previously registered resources provider.
   *
   * @param {(configs: ResourceConfig[]) => ResourceConfig[]} provider
   */
  unregisterResourcesProvider(provider) {
    this._resourcesProviders = this._resourcesProviders.filter(p => p !== provider);
  }
}
