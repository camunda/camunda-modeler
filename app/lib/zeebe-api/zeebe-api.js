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

/**
 * @typedef CamundaResource
 * @property {string} content
 * @property {string} name
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
  FORBIDDEN: 'FORBIDDEN',
  OAUTH_URL: 'OAUTH_URL',
  UNSUPPORTED_ENGINE: 'UNSUPPORTED_ENGINE',
  INVALID_CLIENT_ID: 'INVALID_CLIENT_ID',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS'
};

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
 */

/**
 * @typedef {typeof import('@camunda8/sdk').Camunda8} Camunda8Constructor
 * @typedef {import('@camunda8/sdk/dist/zeebe').ZeebeGrpcClient} ZeebeGrpcClient
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
      resourceConfigs,
      tenantId
    } = config;

    this._log.debug('deploy', {
      parameters: sanitizeConfigWithEndpoint(config)
    });

    try {
      const {
        zeebeGrpcClient,
        camundaRestClient
      } = await this._getClients(endpoint);

      if (zeebeGrpcClient) {

        /** @type {Array<ZeebeResource>} */
        const resources = this._getZeebeResources(resourceConfigs, tenantId);

        let response;

        if (resources.length > 1) {
          this._log.debug('deploying resources', resources);

          response = await zeebeGrpcClient.deployResources(resources, tenantId);
        } else {
          this._log.debug('deploying resource', resources[0]);

          response = await zeebeGrpcClient.deployResource(resources[0]);
        }

        return {
          success: true,
          response: response
        };
      }

      if (camundaRestClient) {
        const resources = this._getCamundaResources(resourceConfigs);

        let response = await camundaRestClient.deployResources(resources, tenantId);

        // mapping response to be compatible with grpcResponse
        return {
          success: true,
          response: {
            ...response,
            key: response.deploymentKey,
            deployments: response.deployments.map(deployment=>{
              if (deployment.processDefinition) {
                return {
                  ...deployment,
                  process: {
                    ...deployment.processDefinition,
                    bpmnProcessId: deployment.processDefinition.processDefinitionId,
                    version: deployment.processDefinition.processDefinitionVersion
                  }
                };
              }
              if (deployment.decisionDefinition) {
                return {
                  ...deployment,
                  decision: {
                    ...deployment.decisionDefinition,
                    decisionId: deployment.decisionDefinition.decisionDefinitionId,
                    dmnDecisionId: deployment.decisionDefinition.decisionDefinitionId,
                    dmnDecisionName: deployment.decisionDefinition.name,
                    dmnDecisionRequirementsId: deployment.decisionDefinition.decisionRequirementsId,
                    decisionKey: deployment.decisionDefinition.decisionDefinitionKey,
                  }
                };
              }
              if (deployment.decisionRequirements) {
                return {
                  ...deployment,
                  decisionRequirements: {
                    ...deployment.decisionRequirements,
                    dmnDecisionRequirementsId: deployment.decisionRequirements.decisionRequirementsId,
                    dmnDecisionRequirementsName: deployment.decisionRequirements.decisionRequirementsName
                  }
                };
              }
              return deployment;
            })
          }
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
      processDefinitionKey,
      processId,
      startInstructions,
      runtimeInstructions,
      tenantId
    } = config;

    this._log.debug('start instance', {
      parameters: sanitizeConfigWithEndpoint(config)
    });

    try {
      const {
        zeebeGrpcClient,
        camundaRestClient
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
          tenantId
        });

        return {
          success: true,
          response: response
        };
      }

      if (camundaRestClient) {

        const requestBody = {
          variables,
          startInstructions,
          runtimeInstructions,
          tenantId
        };

        if (processDefinitionKey) {
          requestBody.processDefinitionKey = processDefinitionKey;
        } else {
          requestBody.processDefinitionId = processId;
        }

        const response = await camundaRestClient.createProcessInstance(requestBody);

        return {
          success: true,
          response: response
        };
      }
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
        zeebeGrpcClient,
        camundaRestClient
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

      if (camundaRestClient) {
        const topologyResponse = await camundaRestClient.getTopology();

        return {
          success: true,
          response: {
            protocol: 'rest',
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
   * Search process instances. Requires Camunda REST client.
   */
  async searchProcessInstances(config) {
    const {
      endpoint,
      processInstanceKey
    } = config;

    this._log.debug('search process instances', {
      parameters: sanitizeConfigWithEndpoint(config)
    });

    try {
      const { camundaRestClient } = await this._getClients(endpoint);

      if (!camundaRestClient) {
        throw new Error('Camunda REST client is not available');
      }

      const response = await camundaRestClient.searchProcessInstances({
        filter: {
          processInstanceKey
        }
      });

      return {
        success: true,
        response: response
      };
    } catch (err) {
      this._log.error('search process instances failed', {
        parameters: sanitizeConfigWithEndpoint(config)
      }, err);

      return {
        success: false,
        reason: getErrorReason(err, endpoint)
      };
    }
  }

  /**
   * Search variables. Requires Camunda REST client.
   */
  async searchVariables(config) {
    const {
      endpoint,
      processInstanceKey
    } = config;

    this._log.debug('search variables', {
      parameters: sanitizeConfigWithEndpoint(config)
    });

    try {
      const { camundaRestClient } = await this._getClients(endpoint);

      if (!camundaRestClient) {
        throw new Error('Camunda REST client is not available');
      }

      const response = await camundaRestClient.searchVariables({
        filter: {
          processInstanceKey
        }
      });

      return {
        success: true,
        response: response
      };
    } catch (err) {
      this._log.error('search variables failed', {
        parameters: sanitizeConfigWithEndpoint(config)
      }, err);

      return {
        success: false,
        reason: getErrorReason(err, endpoint)
      };
    }
  }

  async searchElementInstances(config) {
    const {
      endpoint,
      processInstanceKey
    } = config;

    this._log.debug('search element instances', {
      parameters: sanitizeConfigWithEndpoint(config)
    });

    try {
      const { camundaRestClient } = await this._getClients(endpoint);

      if (!camundaRestClient) {
        throw new Error('Camunda REST client is not available');
      }

      const response = await camundaRestClient.searchElementInstances({
        filter: {
          processInstanceKey
        }
      });

      return {
        success: true,
        response: response
      };
    } catch (err) {
      this._log.error('search element instances failed', {
        parameters: sanitizeConfigWithEndpoint(config)
      }, err);

      return {
        success: false,
        reason: getErrorReason(err, endpoint)
      };
    }
  }

  /**
   * Search incidents. Requires Camunda REST client.
   */
  async searchIncidents(config) {
    const {
      endpoint,
      processInstanceKey
    } = config;

    this._log.debug('search incidents', {
      parameters: sanitizeConfigWithEndpoint(config)
    });

    try {
      const { camundaRestClient } = await this._getClients(endpoint);

      if (!camundaRestClient) {
        throw new Error('Camunda REST client is not available');
      }

      const response = await camundaRestClient.searchIncidents({
        filter: {
          processInstanceKey
        }
      });

      return {
        success: true,
        response: response
      };
    } catch (err) {
      this._log.error('search incidents failed', {
        parameters: sanitizeConfigWithEndpoint(config)
      }, err);

      return {
        success: false,
        reason: getErrorReason(err, endpoint)
      };
    }
  }

  /**
   * Get resources based on the provided configs and tenantId.
   *
   * @param {Array<{ path: string, type?: 'bpmn'|'dmn'|'form' | 'rpa' }>} resourceConfigs
   * @param {string} [tenantId]
   *
   * @returns {Array<ZeebeResource>}
   */
  _getZeebeResources(resourceConfigs, tenantId) {
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

      if (resourceConfigs.length === 1 && tenantId && tenantId.length) {
        resource.tenantId = tenantId;
      }

      return resource;
    });
  }

  /**
   * Get resources based on the provided configs and tenantId.
   *
   * @param {Array<{ path: string, type?: 'bpmn'|'dmn'|'form' | 'rpa' }>} resourceConfigs
   *
   * @returns {Array<CamundaResource>}
   */
  _getCamundaResources(resourceConfigs) {

    return resourceConfigs.map(resourceConfig => {
      const { contents } = this._fs.readFile(resourceConfig.path, { encoding: false });

      const extension = `.${ resourceConfig.type }`;

      const name = `${ path.basename(resourceConfig.path, path.extname(resourceConfig.path)) }${ extension }`;

      return {
        content: contents,
        name: name
      };
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
  if (code === 14 || code === 13 || httpStatus === 503) {
    return type === ENDPOINT_TYPES.CAMUNDA_CLOUD
      ? ERROR_REASONS.CLUSTER_UNAVAILABLE
      : ERROR_REASONS.CONTACT_POINT_UNAVAILABLE;
  } else if (code === 12) {
    return ERROR_REASONS.UNSUPPORTED_ENGINE;
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
  return pick(error, [ 'message', 'code', 'details' ]);
}

