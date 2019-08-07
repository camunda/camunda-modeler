/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

'use strict';

class Deployer {
  constructor({ fetch, fs, FormData }) {
    this.fetch = fetch;
    this.fs = fs;
    this.formDataConstructor = FormData;
  }

  /**
   * Deploy diagram to the given endpoint URL.
   */
  async deploy(url, options) {
    try {
      this.validateDeploymentParams(url, options);

      const requestParams = this.getDeploymentRequestParams(options);

      const response = await this.tryFetch(url, requestParams);

      return response;
    } catch (error) {
      error.deploymentName = options.deploymentName;

      throw error;
    }
  }

  /**
   * Ping server
   */
  async ping(url, options) {
    const headers = this.getHeaders(options);

    const response = await this.tryFetch(url, { headers });

    return response;
  }

  validateDeploymentParams(url, { deploymentName, file }) {
    if (!deploymentName) {
      throw new Error('Failed to deploy process, deployment name must be provided.');
    }

    if (!file || !file.name || !file.path) {
      throw new Error('Failed to deploy process, file name and path must be provided.');
    }

    if (!url) {
      throw new Error('Failed to deploy process, endpoint url must not be empty.');
    }
  }

  getDeploymentRequestParams(options) {
    const body = this.getDeploymentBody(options);
    const headers = this.getHeaders(options);

    return {
      body,
      headers,
      method: 'POST'
    };
  }

  async tryFetch(url, requestParams) {
    const serverResponse = await this.fetch(url, requestParams);
    const response = await this.extractResponse(serverResponse);

    return response;
  }

  async extractResponse(serverResponse) {
    if (!serverResponse.ok) {
      const error = await getErrorFromResponse(serverResponse);
      throw error;
    }

    return serverResponse.json();
  }

  getDeploymentBody({ deploymentName, tenantId, file = {} }) {
    const form = this.getFormData();

    form.append('deployment-name', deploymentName);

    if (tenantId) {
      form.append('tenant-id', tenantId);
    }

    form.append('deployment-source', 'Camunda Modeler');

    form.append('deploy-changed-only', 'true');

    form.append(file.name, this.fs.createReadStream(file.path));

    return form;
  }

  getHeaders({ auth }) {
    const headers = {};

    if (auth) {
      headers['Authorization'] = this.getAuthHeader(auth);
    }

    return headers;
  }

  getAuthHeader(auth) {
    const authHeaderBuilder = new AuthHeaderBuilder(auth);

    return authHeaderBuilder.build();
  }

  getFormData() {
    return new this.formDataConstructor();
  }
}


module.exports = Deployer;



// helpers //////
class AuthHeaderBuilder {
  constructor(options) {
    this.options = options;
  }

  build() {
    const {
      bearer,
      password,
      username
    } = this.options;

    if (bearer) {
      return this.getBearerHeader(bearer);
    }

    if (username && password) {
      return this.getBasicHeader(username, password);
    }

    throw new Error('Unknown auth options.');
  }

  getBearerHeader(bearer) {
    return `Bearer ${bearer}`;
  }

  getBasicHeader(username, password) {
    const credentials = btoa(`${username}:${password}`);

    return `Basic ${credentials}`;
  }
}

function btoa(input) {
  return Buffer.from(input, 'utf8').toString('base64');
}


async function getErrorFromResponse(response) {
  const error = new Error();

  try {
    const body = await response.json();
    error.message = body.message;
  } catch (_) {
    error.message = response.statusText;
  }

  error.status = response.status;
  error.statusText = response.statusText;
  error.url = response.url;

  return error;
}
