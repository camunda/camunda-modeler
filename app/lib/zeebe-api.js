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

const path = require('path');

const log = require('./log')('app:zeebe-api');

const {
  pick,
  values
} = require('min-dash');

const errorReasons = {
  UNKNOWN: 'UNKNOWN',
  CONTACT_POINT_UNAVAILABLE: 'CONTACT_POINT_UNAVAILABLE',
  UNAUTHORIZED: 'UNAUTHORIZED',
  CLUSTER_UNAVAILABLE: 'CLUSTER_UNAVAILABLE',
  FORBIDDEN: 'FORBIDDEN',
  OAUTH_URL: 'OAUTH_URL',
  UNSUPPORTED_ENGINE: 'UNSUPPORTED_ENGINE'
};

const endpointTypes = {
  SELF_HOSTED: 'selfHosted',
  OAUTH: 'oauth',
  CAMUNDA_CLOUD: 'camundaCloud'
};

const BPMN_SUFFIX = '.bpmn';

/**
 * @typedef {object} ZeebeClientParameters
 * @property {Endpoint} endpoint
 */

/**
 * @typedef {SelfHostedNoAuthEndpoint|SelfHostedOAuthEndpoint|CamundaCloudEndpoint} Endpoint
 */

/**
 * @typedef {object} SelfHostedNoAuthEndpoint
 * @property {'selfHosted'} type
 * @property {string} url
 */

/**
 * @typedef {object} SelfHostedOAuthEndpoint
 * @property {'oauth'} type
 * @property {string} url
 * @property {string} audience
 * @property {string} clientId
 * @property {string} clientSecret
 */

/**
 * @typedef {object} CamundaCloudEndpoint
 * @property {'camundaCloud'} type
 * @property {string} clusterId
 * @property {string} clientId
 * @property {string} clientSecret
 */


class ZeebeAPI {
  constructor(fs, ZeebeNode) {
    this._fs = fs;

    this._ZeebeNode = ZeebeNode;

    this._zeebeClient = null;
  }

  /**
   * @public
   * Check connection with given broker/cluster.
   *
   * @param {ZeebeClientParameters} parameters
   * @returns {{ success: boolean, reason?: string }}
   */
  async checkConnection(parameters) {

    const {
      endpoint
    } = parameters;

    const client = this._getZeebeClient(endpoint);

    try {
      await client.topology();
      return { success: true };
    } catch (err) {
      log.error('Failed to connect with config (secrets omitted):', withoutSecrets(parameters), err);

      return {
        success: false,
        reason: getErrorReason(err, endpoint)
      };
    }
  }

  /**
   * @public
   * Deploy workflow.
   *
   * @param {ZeebeClientParameters & { name: string, filePath: string }} parameters
   * @returns {{ success: boolean, response: object }}
   */
  async deploy(parameters) {

    const {
      endpoint,
      filePath,
      name
    } = parameters;

    const {
      contents
    } = this._fs.readFile(filePath, { encoding: false });

    const client = this._getZeebeClient(endpoint);

    try {
      const response = await client.deployWorkflow({
        definition: contents,
        name: prepareDeploymentName(name, filePath)
      });

      return {
        success: true,
        response: response
      };
    } catch (err) {
      log.error('Failed to deploy with config (secrets omitted):', withoutSecrets(parameters), err);

      return {
        success: false,
        response: asSerializedError(err)
      };
    }
  }

  /**
   * @public
   * Run process instance.
   *
   * @param {ZeebeClientParameters & { processId: string }} parameters
   * @returns {{ success: boolean, response: object }}
   */
  async run(parameters) {

    const {
      endpoint,
      processId
    } = parameters;

    const client = this._getZeebeClient(endpoint);

    try {

      const response = await client.createWorkflowInstance({
        bpmnProcessId: processId
      });

      return {
        success: true,
        response: response
      };
    } catch (err) {
      log.error('Failed to run instance with config (secrets omitted):', withoutSecrets(parameters), err);

      return {
        success: false,
        response: asSerializedError(err)
      };
    }
  }

  _getCachedZeebeClient(endpoint) {
    const cachedEndpoint = this._cachedEndpoint;

    if (isHashEqual(endpoint, cachedEndpoint)) {
      return this._zeebeClient;
    }
  }

  _getZeebeClient(endpoint) {

    // (1) use existing Zeebe Client for endpoint
    const cachedZeebeClient = this._getCachedZeebeClient(endpoint);

    if (cachedZeebeClient) {
      return cachedZeebeClient;
    }

    // (2) cleanup old client instance
    this._shutdownZeebeClientInstance();

    // (3) create new Zeebe Client for endpoint configuration
    this._zeebeClient = this._createZeebeClient(endpoint);
    this._cachedEndpoint = endpoint;

    return this._zeebeClient;
  }

  _shutdownZeebeClientInstance() {
    this._zeebeClient && this._zeebeClient.close();
  }

  _createZeebeClient(endpoint) {
    const {
      type,
      url
    } = endpoint;

    let options = {
      retry: false
    };

    if (!values(endpointTypes).includes(type)) {
      return;
    }

    if (type === endpointTypes.OAUTH) {
      options = {
        ...options,
        oAuth: {
          url: endpoint.oauthURL,
          audience: endpoint.audience,
          clientId: endpoint.clientId,
          clientSecret: endpoint.clientSecret,
          cacheOnDisk: false
        },
        useTLS: true
      };
    } else if (type === endpointTypes.CAMUNDA_CLOUD) {
      options = {
        ...options,
        camundaCloud: {
          clientId: endpoint.clientId,
          clientSecret: endpoint.clientSecret,
          clusterId: endpoint.clusterId,
          cacheOnDisk: false
        },
        useTLS: true
      };
    }

    return new this._ZeebeNode.ZBClient(url, options);
  }
}

module.exports = ZeebeAPI;


// helpers //////////////////////

function getErrorReason(error, endpoint) {

  const {
    code,
    message
  } = error;

  const {
    type
  } = endpoint;

  // (1) handle grpc errors
  if (code === 14) {
    return (type === endpointTypes.CAMUNDA_CLOUD
      ? errorReasons.CLUSTER_UNAVAILABLE
      : errorReasons.CONTACT_POINT_UNAVAILABLE
    );
  } else if (code === 12) {
    return errorReasons.UNSUPPORTED_ENGINE;
  }

  // (2) handle <unknown>
  if (!message) {
    return errorReasons.UNKNOWN;
  }

  // (3) handle <not found>
  if (message.includes('ENOTFOUND') || message.includes('Not Found')) {
    if (type === endpointTypes.OAUTH) {
      return errorReasons.OAUTH_URL;
    } else if (type === endpointTypes.CAMUNDA_CLOUD) {
      return errorReasons.CLUSTER_UNAVAILABLE;
    }

    return errorReasons.CONTACT_POINT_UNAVAILABLE;
  }

  // (4) handle other error messages
  if (message.includes('Unauthorized')) {
    return errorReasons.UNAUTHORIZED;
  }

  if (message.includes('Forbidden')) {
    return errorReasons.FORBIDDEN;
  }

  if (message.includes('Unsupported protocol') && type === endpointTypes.OAUTH) {
    return errorReasons.OAUTH_URL;
  }

  return errorReasons.UNKNOWN;
}

function isHashEqual(parameter1, parameter2) {
  return JSON.stringify(parameter1) === JSON.stringify(parameter2);
}

function withoutSecrets(parameters) {
  const endpoint = pick(parameters.endpoint, [ 'type', 'url', 'clientId', 'oauthURL' ]);

  return { ...parameters, endpoint };
}

// With zeebe-node 0.23.0, the deployment name should end with
// .bpmn suffix.
//
// If name is empty, we'll return the file name. If name is not empty
// but does not end with .bpmn, we'll add the suffix.
function prepareDeploymentName(name, filePath) {

  try {

    if (!name || name.length === 0) {

      return path.basename(filePath, path.extname(filePath)) + BPMN_SUFFIX;
    }

    if (!name.endsWith(BPMN_SUFFIX)) {

      return name + BPMN_SUFFIX;
    }

  } catch (err) {

    log.error('Error happened preparing deployment name: ', err);
  }

  return name;
}

function asSerializedError(error) {
  return pick(error, [ 'message', 'code', 'details' ]);
}
