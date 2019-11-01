/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import {
  ConnectionError,
  DeploymentError
} from './errors';

const FETCH_TIMEOUT = 5000;


export default class CamundaAPI {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async deployDiagram(diagram, details) {
    const {
      auth,
      deploymentName,
      tenantId
    } = details;

    const form = new FormData();

    form.append('deployment-name', deploymentName);
    form.append('deployment-source', 'Camunda Modeler');

    // TODO
    // form.append('deploy-changed-only', 'true');

    if (tenantId) {
      form.append('tenant-id', tenantId);
    }

    const diagramName = diagram.name;

    const blob = new Blob([ diagram.contents ], { type: 'text/xml' });

    form.append(diagramName, blob, diagramName);

    const headers = this.getHeaders(auth);

    const response = await this.safelyFetch(`${this.baseUrl}/deployment/create`, {
      method: 'POST',
      body: form,
      headers
    });

    if (response.ok) {

      const res = await response.json();

      const {
        id,
        deployedProcessDefinitions
      } = res;

      return {
        id,
        deployedProcessDefinitions,
        deployedProcessDefinition: Object.values(deployedProcessDefinitions || {})[0]
      };
    }

    const body = await this.safelyParse(response);

    throw new DeploymentError(response, body);
  }

  async runInstance(processDefinition, details) {

    // TODO(pinussilvestrus): handle authentication
    const {
      auth
    } = details;

    const headers ={
      'accept': 'application/json',
      'content-type': 'application/json'
    };

    const response = await this.safelyFetch(`${this.baseUrl}/process-definition/${processDefinition.id}/start`, {
      method: 'POST',
      body: JSON.stringify({}),
      headers
    });

    if (response.ok) {

      const res = await response.json();

      const {
        id
      } = res;

      return {
        processInstanceId: id
      };
    }

    const body = await this.safelyParse(response);

    throw new DeploymentError(response, body);

  }

  async checkConnection(details = {}) {
    const { auth } = details;

    const headers = this.getHeaders(auth);

    const response = await this.safelyFetch(`${this.baseUrl}/deployment?maxResults=0`, { headers });

    if (response.ok) {
      return;
    }

    throw new ConnectionError(response);
  }

  getHeaders(auth) {
    const headers = {
      accept: 'application/json'
    };

    if (auth) {
      headers.authorization = this.getAuthHeader(auth);
    }

    return headers;
  }

  getAuthHeader({ bearer, username, password }) {
    if (bearer) {
      return `Bearer ${bearer}`;
    }

    if (username && password) {
      const credentials = window.btoa(`${username}:${password}`);

      return `Basic ${credentials}`;
    }

    throw new Error('Unknown auth options.');
  }

  async safelyFetch(url, options = {}) {
    let response;

    try {
      options.signal = options.signal || this.setupTimeoutSignal();
      response = await fetch(url, options);
    } catch (error) {
      response = {
        url,
        json: () => {
          return {};
        }
      };
    }

    return response;
  }

  setupTimeoutSignal(timeout = FETCH_TIMEOUT) {
    const controller = new AbortController();

    const { signal } = controller;

    setTimeout(() => controller.abort(), timeout);

    return signal;
  }

  async safelyParse(response) {
    try {
      const json = await response.json();

      return json;
    } catch (error) {
      return {};
    }
  }
}