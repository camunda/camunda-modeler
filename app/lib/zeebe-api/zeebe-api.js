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
 * @typedef {import('@camunda8/sdk/dist/zeebe/lib/deployResource').Resource} ZeebeResource
 */

/**
 * @typedef {import('@camunda8/sdk/dist/zeebe/types').DeployResourceResponse} GrpcDeployResourceResponse
 */

'use strict';

const path = require('path');
const { pick } = require('min-dash');


const createLog = require('../log');
const CamundaClientFactory = require('./camunda-client-factory');
const { sanitizeConfigWithEndpoint } = require('./utils');


const ERROR_REASONS = {
  UNKNOWN: 'UNKNOWN',
  CONTACT_POINT_UNAVAILABLE: 'CONTACT_POINT_UNAVAILABLE',
  UNAUTHORIZED: 'UNAUTHORIZED',
  CLUSTER_UNAVAILABLE: 'CLUSTER_UNAVAILABLE',
  CLUSTER_TEMPORARILY_UNAVAILABLE: 'CLUSTER_TEMPORARILY_UNAVAILABLE',
  FORBIDDEN: 'FORBIDDEN',
  OAUTH_URL: 'OAUTH_URL',
  UNSUPPORTED_ENGINE: 'UNSUPPORTED_ENGINE',
  INVALID_CLIENT_ID: 'INVALID_CLIENT_ID',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS'
};

// system-level network error codes, raised e.g. by REST calls against an
// unreachable endpoint
const NETWORK_ERROR_CODES = [ 'ECONNREFUSED', 'ETIMEDOUT', 'EHOSTUNREACH', 'ENETUNREACH' ];

// HTTP status codes a proxy/ingress returns when the cluster behind it is
// unreachable, paused or scaled to zero
const UNAVAILABLE_HTTP_STATUSES = [ 502, 503, 504 ];

const {
  AUTH_TYPES,
  ENDPOINT_TYPES,
  RESOURCE_TYPES
} = require('./constants');

/**
 * @typedef {Object} DeploymentConfig
 * @property {import("./endpoints").Endpoint} endpoint
 */

/**
 * @typedef {Object} StartInstanceConfig
 * @property {import("./endpoints").Endpoint} endpoint
 * @property {string} processId
 * @property {Array} [startInstructions]
 * @property {Array} [runtimeInstructions]
 * @property {Object} [variables]
 * @property {string} [businessId]
 */

/**
 * @typedef {typeof import('@camunda8/sdk').Camunda8} Camunda8Constructor
 * @typedef {import('@camunda8/sdk/dist/zeebe').ZeebeGrpcClient} ZeebeGrpcClient
 */

/**
 * Camunda 8 calls through the SDK. REST endpoints are served by
 * `app/lib/c8ctl`; here, those calls are gRPC-only. Listing secrets still
 * uses the REST client.
 */
class ZeebeAPI {

  /**
   * @param { {
   *   readFile: (path: string, options?: { encoding: boolean }) => { contents: string },
   * } } fs
   * @param {Camunda8Constructor} Camunda8
   * @param {any} flags
   * @param {any} [log]
   */
  constructor(fs, Camunda8, flags, log = createLog('app:zeebe-api')) {
    this._fs = fs;

    /**
     * @type { Camunda8Constructor }
     */
    this._Camunda8 = Camunda8;
    this._flags = flags;
    this._log = log;

    /** @type {CamundaClientFactory} */
    this._camundaClients = new CamundaClientFactory(fs, Camunda8, flags, log);
  }

  /**
   * Check connection with given endpoint.
   *
   * @param {{ endpoint: import("./endpoints").Endpoint }} config
   *
   * @returns {Promise<{ success: boolean, reason?: string }>}
   */
  async checkConnection(config) {
    this._log.debug('check connection', {
      parameters: sanitizeConfigWithEndpoint(config)
    });

    return this.getGatewayVersion(config);
  }

  /**
   * Whether the endpoint resolves to the REST API (not gRPC), with the
   * same protocol detection as every other call.
   *
   * @param {import("./endpoints").Endpoint} endpoint
   *
   * @returns {Promise<boolean>}
   */
  async usesRest(endpoint) {
    const { camundaRestClient } = await this._getClients(endpoint);

    return !!camundaRestClient;
  }

  /**
   * @param {import("./endpoints").Endpoint} endpoint
   */
  _getClients(endpoint) {
    return this._camundaClients.getSupportedCamundaClients(endpoint);
  }

  /**
   * Deploy resources with given configuration.
   *
   * @param {DeploymentConfig} config
   *
   * @returns {Promise<{ success: boolean, response: GrpcDeployResourceResponse | { message: string, code?: any, details?: any }}>}
   */
  async deploy(config) {
    const {
      endpoint,
      resourceConfigs
    } = config;

    this._log.debug('deploy', {
      parameters: sanitizeConfigWithEndpoint(config)
    });

    try {
      const {
        zeebeGrpcClient
      } = await this._getClients(endpoint);

      if (zeebeGrpcClient) {

        /** @type {Array<ZeebeResource>} */
        const resources = this._getZeebeResources(resourceConfigs);

        let response;

        if (resources.length > 1) {
          this._log.debug('deploying resources', resources);

          response = await zeebeGrpcClient.deployResources(resources);
        } else {
          this._log.debug('deploying resource', resources[0]);

          response = await zeebeGrpcClient.deployResource(resources[0]);
        }

        return {
          success: true,
          response: response
        };
      }

      return {
        success: false,
        response: {
          message: 'No client available for deployment'
        }
      };
    } catch (err) {
      this._log.error('deploy failed', sanitizeConfigWithEndpoint(config), err);

      return {
        success: false,
        response: asSerializedError(err)
      };
    }
  }

  /**
   * Start instance of process with given process ID and configuration.
   *
   * @param {StartInstanceConfig} config
   *
   * @returns {Promise<{ success: boolean, response: object }>}
   */
  async startInstance(config) {
    const {
      endpoint,
      variables,
      processId,
      startInstructions,
      runtimeInstructions,
      businessId
    } = config;

    this._log.debug('start instance', {
      parameters: sanitizeConfigWithEndpoint(config)
    });

    try {
      const {
        zeebeGrpcClient
      } = await this._getClients(endpoint);

      if (zeebeGrpcClient) {

        if (runtimeInstructions) {
          return {
            success: false,
            response: 'Runtime instructions are not supported with gRPC client'
          };
        }

        const response = await zeebeGrpcClient.createProcessInstance({
          bpmnProcessId: processId,
          variables,
          startInstructions,
          businessId,
        });

        return {
          success: true,
          response: response
        };
      }

      return {
        success: false,
        response: {
          message: 'No client available to start an instance'
        }
      };
    } catch (err) {
      this._log.error('start instance failed', {
        parameters: sanitizeConfigWithEndpoint(config)
      }, err);

      return {
        success: false,
        response: asSerializedError(err)
      };
    }
  }

  /**
   * Get gateway version of given broker/cluster endpoint.
   *
   * @param {{ endpoint: import("./endpoints").Endpoint }} config
   *
   * @returns {Promise<{ success: boolean, response?: object, response?.gatewayVersion: string }>}
   */
  async getGatewayVersion(config) {
    const {
      endpoint
    } = config;

    this._log.debug('fetch gateway version', {
      parameters: sanitizeConfigWithEndpoint(config)
    });

    try {
      const {
        zeebeGrpcClient
      } = await this._getClients(endpoint);

      if (zeebeGrpcClient) {
        const topologyResponse = await zeebeGrpcClient.topology();

        return {
          success: true,
          response: {
            protocol: 'grpc',
            gatewayVersion: topologyResponse.gatewayVersion
          }
        };
      }

      return { success: false };
    } catch (err) {
      this._log.error('fetch gateway version failed', {
        parameters: sanitizeConfigWithEndpoint(config)
      }, err);

      return {
        success: false,
        reason: getErrorReason(err, endpoint)
      };
    }
  }

  /**
   * List the names of the secrets available on the cluster. Requires Camunda
   * REST client. Returns names only — secret values are never fetched.
   *
   * @param {{ endpoint: import("./endpoints").Endpoint }} config
   *
   * @returns {Promise<{ success: boolean, response?: object, reason?: string, status?: number }>}
   */
  async listSecrets(config) {
    const {
      endpoint
    } = config;

    this._log.debug('list secrets', {
      parameters: sanitizeConfigWithEndpoint(config)
    });

    try {
      const { camundaRestClient } = await this._getClients(endpoint);

      if (!camundaRestClient) {
        throw new Error('Camunda REST client is not available');
      }

      const response = await camundaRestClient.callApiEndpoint({
        method: 'POST',
        urlPath: 'secrets/list',
        body: {}
      });

      return {
        success: true,
        response: response
      };
    } catch (err) {
      this._log.error('list secrets failed', {
        parameters: sanitizeConfigWithEndpoint(config)
      }, err);

      return {
        success: false,
        reason: getErrorReason(err, endpoint),
        status: getResponseStatus(err)
      };
    }
  }

  /**
   * Get resources based on the provided configs
   *
   * @param {Array<{ path: string, type?: 'bpmn'|'dmn'|'form' | 'rpa' }>} resourceConfigs
   *
   * @returns {Array<ZeebeResource>}
   */
  _getZeebeResources(resourceConfigs) {
    return resourceConfigs.map(resourceConfig => {
      const { contents } = this._fs.readFile(resourceConfig.path, { encoding: false });

      const extension = `.${ resourceConfig.type }`;

      const name = `${ path.basename(resourceConfig.path, path.extname(resourceConfig.path)) }${ extension }`;

      const resource = {
        name
      };

      if (resourceConfig.type === RESOURCE_TYPES.BPMN) {
        resource.process = contents;
      } else if (resourceConfig.type === RESOURCE_TYPES.DMN) {
        resource.decision = contents;
      } else if (resourceConfig.type === RESOURCE_TYPES.FORM) {
        resource.form = contents;
      } else {

        // fall back to form
        // cf.https://github.com/camunda/camunda-8-js-sdk/blob/e38ea13c2f8285816ade0ff1e4b4e62fbee4a4ba/src/zeebe/lib/deployResource.ts#L54
        resource.form = contents;
      }

      return resource;
    });
  }

}

module.exports = ZeebeAPI;


// helpers //////////

/**
 * @param {string} message
 *
 * @returns {number|undefined}
 */
function getGrpcErrorCode(message) {

  if (message.includes('13 INTERNAL:')) {
    return 13;
  }

  if (message.includes('14 UNAVAILABLE:')) {
    return 14;
  }
}

/**
 * Checks whether the error indicates a connection-level network failure, i.e.
 * the endpoint could not be reached at all.
 *
 * @param {Error} error
 *
 * @returns {boolean}
 */
function isNetworkError(error) {
  return NETWORK_ERROR_CODES.some(code =>
    error.code === code || (error.message || '').includes(code)
  );
}

/**
 * @param {string} message
 *
 * @returns {number|undefined}
 */
function getRestStatusCode(message) {
  if (message.includes('503 (Service Temporarily Unavailable)')) {
    return 503;
  }
}

function getErrorReason(error, endpoint) {
  const {
    message,
    code = message && getGrpcErrorCode(message),
    httpStatus = message && getRestStatusCode(message)
  } = error;

  const {
    type,
    authType = AUTH_TYPES.NONE
  } = endpoint;

  // (1) handle errors
  if (code === 14 || code === 13 || isNetworkError(error)) {
    return type === ENDPOINT_TYPES.CAMUNDA_CLOUD
      ? ERROR_REASONS.CLUSTER_UNAVAILABLE
      : ERROR_REASONS.CONTACT_POINT_UNAVAILABLE;
  } else if (code === 12) {
    return ERROR_REASONS.UNSUPPORTED_ENGINE;
  }

  // (1a) a proxy/ingress answered, but the instance behind it is
  // unavailable, e.g. paused or still starting up
  if (httpStatus === 503 || UNAVAILABLE_HTTP_STATUSES.includes(getResponseStatus(error))) {
    return ERROR_REASONS.CLUSTER_TEMPORARILY_UNAVAILABLE;
  }

  // (2) handle <unknown>
  if (!message) {
    return ERROR_REASONS.UNKNOWN;
  }

  // (3) handle <not found>
  if (message.includes('ENOTFOUND') || message.includes('Not Found')) {
    if (authType === AUTH_TYPES.OAUTH) {
      return ERROR_REASONS.OAUTH_URL;
    } else if (type === ENDPOINT_TYPES.CAMUNDA_CLOUD) {
      return ERROR_REASONS.INVALID_CLIENT_ID;
    }

    return ERROR_REASONS.CONTACT_POINT_UNAVAILABLE;
  }

  // (4) handle other error messages
  if (message.includes('Unauthorized')) {
    return (type === ENDPOINT_TYPES.CAMUNDA_CLOUD
      ? ERROR_REASONS.INVALID_CREDENTIALS
      : ERROR_REASONS.UNAUTHORIZED
    );
  }

  if (message.includes('Forbidden')) {
    return ERROR_REASONS.FORBIDDEN;
  }

  if (message.includes('Unsupported protocol') && authType === AUTH_TYPES.OAUTH) {
    return ERROR_REASONS.OAUTH_URL;
  }

  return ERROR_REASONS.UNKNOWN;
}


function asSerializedError(error) {
  return pick(error, [ 'message', 'code', 'details', 'detail' ]);
}

// HTTP status code of a failed Camunda REST call, if the request reached the
// server (undefined for connection-level failures).
function getResponseStatus(error) {
  if (!error) {
    return undefined;
  }

  return error.statusCode || (error.response && error.response.statusCode);
}

