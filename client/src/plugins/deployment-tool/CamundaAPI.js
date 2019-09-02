/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { ConnectionErrorMessages } from './ErrorMessages';


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
    form.append('deploy-changed-only', 'true');

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

      const {
        id,
        deployedProcessDefinitions
      } = await response.json();

      return {
        id,
        deployedProcessDefinitions,
        deployedProcessDefinition: Object.values(deployedProcessDefinitions || {})[0]
      };
    }

    const json = await this.safelyParse(response);

    throw responseError('Deployment failed', response, json);
  }

  async checkConnection(details = {}) {
    const { auth } = details;

    const headers = this.getHeaders(auth);

    const response = await this.safelyFetch(`${this.baseUrl}/deployment?maxResults=0`, { headers });

    if (response.ok) {
      return;
    }

    throw connectionError(response);
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

  async safelyFetch(url, ...args) {
    let response;

    try {
      response = await fetch(url, ...args);
    } catch (error) {
      response = {
        url,
        json: () => {
          return { message: 'Fetch failed' };
        }
      };
    }

    return response;
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



// helpers //////////////

const parseError = 'ENGINE-09005 Could not parse BPMN process. Errors: \n*';

function responseError(message, response, details) {
  const error = new Error(message);

  error.details = details;
  error.response = response;

  // fix engine not exposing details
  if (details && details.message && details.message.startsWith(parseError)) {
    details.problems = details.message.substring(parseError.length).split(/\s?\n\*\s?/g);
    details.message = 'ENGINE-09005 Could not parse BPMN process';
  }

  return error;
}

function connectionError(response) {
  const error = new Error();

  const errorMessageFromStatus = getStatusCodeErrorMessage(response);

  if (errorMessageFromStatus) {
    error.message = errorMessageFromStatus;

    return error;
  }

  error.message = getNetworkErrorMessage(response);

  return error;
}

function getStatusCodeErrorMessage(response) {
  switch (response.status) {
  case 401:
    return ConnectionErrorMessages.unauthorized;
  case 403:
    return ConnectionErrorMessages.forbidden;
  case 404:
    return ConnectionErrorMessages.notFound;
  case 500:
    return ConnectionErrorMessages.internalServerError;
  case 503:
    return ConnectionErrorMessages.unavailable;
  }
}

function getNetworkErrorMessage(response) {
  if (!/^https?:\/\/localhost/.test(response.url) && !window.navigator.onLine) {
    return ConnectionErrorMessages.noInternetConnection;
  }

  return ConnectionErrorMessages.unableToConnect;
}
