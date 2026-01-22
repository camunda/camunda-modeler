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

import { validateConnection } from '../../plugins/zeebe-plugin/connection-manager-plugin/ConnectionValidator.js';

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
