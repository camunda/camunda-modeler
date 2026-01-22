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

import { generateId } from '../../util/index.js';
import { AUTH_TYPES, TARGET_TYPES } from '../../remote/ZeebeAPI.js';
import { SETTINGS_KEY_CONNECTIONS } from '../../plugins/zeebe-plugin/connection-manager-plugin/ConnectionManagerSettings.js';
import { NO_CONNECTION } from '../../plugins/zeebe-plugin/connection-manager-plugin/ConnectionManagerPlugin.js';

/**
 * @typedef {import('./Deployment').DeploymentConfig} DeploymentConfig
 * @typedef {import('./Deployment').DeploymentResult} DeploymentResult
 * @typedef {import('./Deployment').Endpoint} Endpoint
 * @typedef {import('./Deployment').ResourceConfig} ResourceConfig
 */

const STORAGE_KEY = 'connectionId';

const CONFIG_KEYS = {
  CONNECTION_MANAGER: 'connection-manager',
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

export default class ConnectionManager extends EventEmitter {

  /**
   * @param {import('../../app/TabStorage.js').default} tabStorage
   * @param {import('../../remote/Config').default} config
   * @param {import('../../app/Settings').default} settings
   */
  constructor(tabStorage, config, settings) {
    super();

    this._config = config;
    this._settings = settings;
    this._tabStorage = tabStorage;
  }

  /**
   * Get the connection for a tab
   *
   * @param {Object} tab - The tab object
   * @returns {Promise<Endpoint|null>}
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

    const endpoint = this.getEndpoint(connectionId);
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
}
