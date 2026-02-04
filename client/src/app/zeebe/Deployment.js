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
import { validateConnection } from '../../plugins/zeebe-plugin/connection-manager-plugin/ConnectionValidator.js';
import { SETTINGS_KEY_CONNECTIONS } from '../../plugins/zeebe-plugin/connection-manager-plugin/ConnectionManagerSettings.js';
import { NO_CONNECTION } from '../../plugins/zeebe-plugin/connection-manager-plugin/ConnectionManagerPlugin.js';
import { PREDEFINED_CONNECTION_ID } from '../../plugins/zeebe-plugin/connection-manager-plugin/constants.js';

const STORAGE_KEY = 'connectionId';

export const CONFIG_KEYS = {
  CONFIG: 'zeebe-deployment-tool',
  CONNECTION_MANAGER: 'connection-manager',
  ENDPOINTS: 'zeebeEndpoints',
  LAST_USED_CONNECTION: 'lastUsedConnection'
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
   * @param {import('../../app/TabStorage.js').default} tabStorage
   * @param {import('../../remote/Config').default} config
   * @param {import('../../remote/ZeebeAPI').default} zeebeAPI
   * @param {import('../../app/Settings').default} settings
   */
  constructor(tabStorage, config, zeebeAPI, settings) {
    super();

    this._config = config;
    this._settings = settings;
    this._zeebeAPI = zeebeAPI;
    this._tabStorage = tabStorage;

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

    const errors = validateConnection(config.endpoint);
    if (Object.keys(errors).length > 0) {
      return {
        success: false,
        response: {
          message: 'Connection configuration is invalid'
        }
      };
    }

    log(`Deploying to connection ${config.endpoint.name} (${config.endpoint.id}) in the context of ${config.context}`);

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
   * Get the connection for a tab
   *
   * @param {Object} tab - The tab object
   * @returns {Promise<{endpoint: Endpoint, connectionId: string}|null>}
   */
  async getConnectionForTab(tab) {
    if (!tab || !tab.file) {
      return NO_CONNECTION;
    }

    let connectionId = null;

    if (tab.file.path) {
      const fileConfig = await this._config.getForFile(tab.file, CONFIG_KEYS.CONNECTION_MANAGER, {});
      connectionId = fileConfig.connectionId;
    }
    else {
      connectionId = this._tabStorage.get(tab, STORAGE_KEY);
    }

    if (!connectionId) {
      const lastUsedConnectionId = await this._config.get(CONFIG_KEYS.LAST_USED_CONNECTION);
      if (lastUsedConnectionId) {
        connectionId = lastUsedConnectionId;
        await this.setConnectionIdForTab(tab, connectionId);
      }
    }

    let endpoint = this.getEndpoint(connectionId);

    if (!endpoint) {
      endpoint = this.getDefaultEndpoint();

      if (endpoint) {
        await this.setConnectionIdForTab(tab, endpoint.id);
      }
    }

    if (!endpoint) {
      return NO_CONNECTION;
    }

    return endpoint;
  }

  /**
   * Set the connection for a tab
   *
   * @param {Object} tab - The tab object
   * @param {string} connectionId - The connection ID to set
   * @returns {Promise<void>}
   */
  async setConnectionIdForTab(tab, connectionId) {

    if (tab.file?.path) {
      await this._config.setForFile(tab.file, CONFIG_KEYS.CONNECTION_MANAGER, { connectionId });
    }
    this._tabStorage.set(tab, STORAGE_KEY, connectionId);

    if (connectionId) {
      await this._config.set(CONFIG_KEYS.LAST_USED_CONNECTION, connectionId);
    }
  }

  /**
   * Get endpoint with given ID.
   *
   * @param {string} id
   * @returns {Endpoint|null}
   */
  getEndpoint(id) {
    const endpoints = this.getEndpoints();
    return endpoints.find(endpoint => endpoint.id === id) || null;
  }

  /**
   * Get the default endpoint (the predefined c8run connection).
   *
   * @returns {Endpoint|null}
   */
  getDefaultEndpoint() {
    return this.getEndpoint(PREDEFINED_CONNECTION_ID);
  }

  /**
   * Get all endpoints. Ensures that endpoints saved on disk are valid and have
   * an ID.
   *
   * @returns {Array<Endpoint>}
   */
  getEndpoints() {
    const connections = this._settings.get(SETTINGS_KEY_CONNECTIONS);

    if (!connections || !Array.isArray(connections)) {
      return [];
    }

    return connections.filter(connection => connection && !!connection.id);
  }

  /**
   * Handle tab saved event - persist connection from tab storage to config
   *
   * @param {Object} tab - The tab object
   *
   * @returns {Promise<void>}
   */
  async onTabSaved(tab) {
    const connectionId = this._tabStorage.get(tab, STORAGE_KEY);

    if (connectionId && tab.file?.path) {
      await this._config.setForFile(tab.file, CONFIG_KEYS.CONNECTION_MANAGER, { connectionId });
    }
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
