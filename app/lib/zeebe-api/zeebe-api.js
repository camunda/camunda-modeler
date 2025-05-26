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
 * @typedef {import('@camunda8/sdk/dist/zeebe/lib/deployResource').Resource} Resource
 */

'use strict';

const path = require('path');
const getSystemCertificates = require('./get-system-certificates');

const createLog = require('../log');
const { X509Certificate } = require('node:crypto');

const {
  pick,
  values
} = require('min-dash');

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
  ENDPOINT_TYPES
} = require('./constants');

const RESOURCE_TYPES = {
  BPMN: 'bpmn',
  DMN: 'dmn',
  FORM: 'form'
};

/**
 * @typedef {Object} SelfHostedNoAuthEndpoint
 * @property {'selfHosted'} type
 * @property {string} url
 */

/**
 * @typedef {Object} SelfHostedBasicAuthEndpoint
 * @property {'basic'} type
 * @property {string} username
 * @property {string} password
 */

/**
 * @typedef {Object} SelfHostedOAuthEndpoint
 * @property {'oauth'} type
 * @property {string} url
 * @property {string} audience
 * @property {string} [scope]
 * @property {string} clientId
 * @property {string} clientSecret
 */

/**
 * @typedef {Object} CamundaCloudEndpoint
 * @property {'camundaCloud'} type
 * @property {string} url
 * @property {string} clientId
 * @property {string} clientSecret
 */

/**
 * @typedef {SelfHostedNoAuthEndpoint|SelfHostedBasicAuthEndpoint|SelfHostedOAuthEndpoint|CamundaCloudEndpoint} Endpoint
 */

/**
 * @typedef {Object} DeploymentConfig
 * @property {Endpoint} endpoint
 */

/**
 * @typedef {Object} StartInstanceConfig
 * @property {Endpoint} endpoint
 * @property {string} processId
 */

/**
 * @typedef {typeof import('@camunda8/sdk').Camunda8} Camunda8Constructor
 * @typedef {import('@camunda8/sdk/dist/zeebe').ZeebeGrpcClient} ZeebeGrpcClient
 */

class ZeebeAPI {

  /**
   * @param { {
   *   readFile: (path: string, options: { encoding: boolean }) => { contents: string },
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

    /**
     * @type { Camunda8Client }
     */
    this._camunda8Client = null;
  }

  /**
   * Check connection with given endpoint.
   *
   * @param {{ endpoint: Endpoint }} config
   *
   * @returns {Promise<{ success: boolean, reason?: string }>}
   */
  async checkConnection(config) {
    const { endpoint } = config;

    const camunda8Client = await this._getCamunda8Client(endpoint);

    const client = camunda8Client.getZeebeGrpcApiClient();

    this._log.debug('check connection', {
      parameters: filterEndpointParameters(config)
    });

    try {
      await client.topology();
      return { success: true };
    } catch (err) {
      this._log.error('connection check failed', {
        parameters: filterEndpointParameters(config)
      }, err);

      return {
        success: false,
        reason: getErrorReason(err, endpoint)
      };
    }
  }

  /**
   * Deploy resources with given configuration.
   *
   * @param {DeploymentConfig} config
   *
   * @returns {Promise<{ success: boolean, response: object }>}
   */
  async deploy(config) {
    const {
      endpoint,
      resourceConfigs,
      tenantId
    } = config;

    this._log.debug('deploy', {
      parameters: filterEndpointParameters(config)
    });

    const camunda8Client = await this._getCamunda8Client(endpoint);

    const client = camunda8Client.getZeebeGrpcApiClient();

    try {

      /** @type {Array<Resource>} */
      const resources = this._getResources(resourceConfigs, tenantId);

      let response;

      if (resources.length > 1) {
        this._log.debug('deploying resources', resources);

        response = await client.deployResources(resources, tenantId);
      } else {
        this._log.debug('deploying resource', resources[0]);

        response = await client.deployResource(resources[0]);
      }

      return {
        success: true,
        response: response
      };
    } catch (err) {
      this._log.error('deploy failed', filterEndpointParameters(config), err);

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
   * @returns {{ success: boolean, response: object }}
   */
  async startInstance(config) {
    const {
      endpoint,
      variables,
      processId,
      tenantId,
      startInstructions = [],
      withResult = false
    } = config;

    this._log.debug('start instance', {
      parameters: filterEndpointParameters(config)
    });

    const camunda8Client = await this._getCamunda8Client(endpoint);

    const client = camunda8Client.getZeebeGrpcApiClient();

    try {
      let response;

      if (withResult) {
        response = await client.createProcessInstanceWithResult({
          bpmnProcessId: processId,
          variables,
          tenantId,
          startInstructions
        });
      } else {
        response = await client.createProcessInstance({
          bpmnProcessId: processId,
          variables,
          tenantId,
          startInstructions
        });
      }

      return {
        success: true,
        response: response
      };
    } catch (err) {
      this._log.error('start instance failed', {
        parameters: filterEndpointParameters(config)
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
   * @param {{ endpoint: Endpoint }} config
   *
   * @returns {{ success: boolean, response?: object, response?.gatewayVersion: string }}
   */
  async getGatewayVersion(config) {
    const {
      endpoint
    } = config;

    this._log.debug('fetch gateway version', {
      parameters: filterEndpointParameters(config)
    });

    const camunda8Client = await this._getCamunda8Client(endpoint);

    const client = camunda8Client.getZeebeGrpcApiClient();

    try {
      const topologyResponse = await client.topology();

      return {
        success: true,
        response: {
          gatewayVersion: topologyResponse.gatewayVersion
        }
      };
    } catch (err) {
      this._log.error('fetch gateway version failed', {
        parameters: filterEndpointParameters(config)
      }, err);

      return {
        success: false,
        reason: getErrorReason(err, config.endpoint)
      };
    }
  }

  _getCachedCamunda8Client(endpoint) {
    const cachedEndpoint = this._cachedEndpoint;

    if (isHashEqual(endpoint, cachedEndpoint)) {
      return this._camunda8Client;
    }
  }

  async _getCamunda8Client(endpoint) {

    // (1) use existing Camunda 8 Client for endpoint
    const cachedCamunda8Client = this._getCachedCamunda8Client(endpoint);

    if (cachedCamunda8Client) {
      return cachedCamunda8Client;
    }

    // (2) cleanup old client instance
    this._shutdownCamunda8ClientInstance();

    // (3) create new Camunda 8 Client for endpoint configuration
    this._camunda8Client = await this._createCamunda8Client(endpoint);
    this._cachedEndpoint = endpoint;

    return this._camunda8Client;
  }

  _shutdownCamunda8ClientInstance() {

    if (this._camunda8Client) {
      this._log.debug('shutdown Camunda 8 client');

      this._camunda8Client.getZeebeGrpcApiClient().close();
    }
  }

  /**
   * @param {any} endpoint
   *
   * @returns { Promise<ZeebeGrpcClient> }
   */
  async _createCamunda8Client(endpoint) {
    const {
      type,
      authType = AUTH_TYPES.NONE,
      url
    } = endpoint;

    let options = {
      ZEEBE_GRPC_ADDRESS: endpoint.url ? removeProtocol(endpoint.url) : '',
      zeebeGrpcSettings: { ZEEBE_GRPC_CLIENT_RETRY: false }
    };

    if (!values(ENDPOINT_TYPES).includes(type) || !values(AUTH_TYPES).includes(authType)) {

      // TODO(nikku): this should throw an error as consumers of this method
      //   _never_ handle a null zeebe client appropriately
      return;
    }

    if (authType === AUTH_TYPES.BASIC) {
      options = {
        ...options,
        CAMUNDA_AUTH_STRATEGY: 'BASIC',
        CAMUNDA_BASIC_AUTH_USERNAME: endpoint.basicAuthUsername,
        CAMUNDA_BASIC_AUTH_PASSWORD: endpoint.basicAuthPassword
      };
    } else if (authType === AUTH_TYPES.OAUTH) {
      options = {
        ...options,
        CAMUNDA_AUTH_STRATEGY: 'OAUTH',
        ZEEBE_CLIENT_ID: endpoint.clientId,
        ZEEBE_CLIENT_SECRET: endpoint.clientSecret,
        CAMUNDA_OAUTH_URL: endpoint.oauthURL,
        CAMUNDA_TOKEN_SCOPE: endpoint.scope,
        CAMUNDA_ZEEBE_OAUTH_AUDIENCE: endpoint.audience,
        CAMUNDA_TOKEN_DISK_CACHE_DISABLE: true
      };
    } else if (type === ENDPOINT_TYPES.CAMUNDA_CLOUD) {
      options = {
        ...options,
        CAMUNDA_AUTH_STRATEGY: 'OAUTH',
        CAMUNDA_OAUTH_URL: 'https://login.cloud.camunda.io/oauth/token',
        CAMUNDA_ZEEBE_OAUTH_AUDIENCE: endpoint.audience,
        CAMUNDA_TOKEN_SCOPE: endpoint.scope,
        ZEEBE_CLIENT_ID: endpoint.clientId,
        ZEEBE_CLIENT_SECRET: endpoint.clientSecret,
        CAMUNDA_TOKEN_DISK_CACHE_DISABLE: true,
        CAMUNDA_SECURE_CONNECTION: true,
        CAMUNDA_CONSOLE_CLIENT_ID: endpoint.clientId,
        CAMUNDA_CONSOLE_CLIENT_SECRET: endpoint.clientSecret
      };
    } else if (type === ENDPOINT_TYPES.SELF_HOSTED) {
      options = {
        ...options,
        CAMUNDA_OAUTH_DISABLED: true,
      };
    }

    options = await this._withTLSConfig(url, options);

    // do not override camunda cloud port (handled by the client)
    if (type !== ENDPOINT_TYPES.CAMUNDA_CLOUD) {
      options = this._withPortConfig(url, options);
    }

    this._log.debug('creating client', {
      url,
      options: filterCamunda8Options(options)
    });

    function getClusterId(clusterURL) {
      const matches = clusterURL.match(/([a-z\d]+-){2,}[a-z\d]+/g);

      return matches ? matches[0] : null;
    }

    function getClusterRegion(clusterURL) {
      const matches = clusterURL.match(/(?<=\.)[a-z]+-[\d]+/g);

      return matches ? matches[0] : null;
    }

    function getOperateUrl(url) {

      const clusterId = getClusterId(url),
            clusterRegion = getClusterRegion(url);

      if (!clusterId || !clusterRegion) {
        return null;
      }

      return new URL(`https://${ clusterRegion }.operate.camunda.io/${ clusterId }`);
    }

    const camundaClient = new this._Camunda8({
      ...options,
      CAMUNDA_OPERATE_BASE_URL: getOperateUrl(url),
      CAMUNDA_AUTH_STRATEGY:'OAUTH',
      CAMUNDA_OAUTH_URL: 'https://login.cloud.camunda.io/oauth/token'
    });

    return camundaClient;
  }

  async _withTLSConfig(url, options) {
    const rootCerts = [];

    // (0) set `useTLS` according to the protocol
    const tlsOptions = {
      CAMUNDA_SECURE_CONNECTION: options.CAMUNDA_SECURE_CONNECTION || /^https:\/\//.test(url)
    };

    // (1) use certificate from flag
    const customCertificatePath = this._flags.get('zeebe-ssl-certificate');

    if (customCertificatePath) {
      const cert = this._readRootCertificate(customCertificatePath);

      if (cert) {
        rootCerts.push(cert);
      }
    }

    // (2) use certificates from OS keychain
    const systemCertificates = await getSystemCertificates();
    rootCerts.push(...systemCertificates);

    if (!rootCerts.length) {
      return { ...options, ...tlsOptions };
    }

    const rootCertsBuffer = Buffer.from(rootCerts.join('\n'));

    return {
      ...options,
      ...tlsOptions,
      CAMUNDA_CUSTOM_ROOT_CERT_STRING: rootCertsBuffer
    };
  }

  _withPortConfig(url, options) {

    // do not override camunda cloud port (handled by zeebe-node)
    if (options.camundaCloud) {
      return options;
    }

    const parsedUrl = new URL(url);

    // do not override port if already set in url
    if (parsedUrl.port) {
      return options;
    }

    return {
      ...options,
      port: parsedUrl.protocol === 'https:' ? '443' : '80'
    };
  }

  _readRootCertificate(certPath) {
    let cert;

    try {
      const absolutePath = path.isAbsolute(certPath) ?
        certPath : path.join(process.cwd(), certPath);

      cert = this._fs.readFile(absolutePath).contents;

    } catch (err) {
      this._log.error('Failed to read custom SSL certificate:', err);

      return;
    }

    let parsed;
    try {
      parsed = new X509Certificate(cert);
    } catch (err) {
      this._log.warn('Failed to parse custom SSL certificate:', err);
    }

    if (parsed && parsed.issuer !== parsed.subject) {
      this._log.warn('Custom SSL certificate appears to be not a root certificate');
    }

    return cert;
  }

  /**
   * Get resources based on the provided configs and tenantId.
   *
   * @param {resourceConfigs: Array<{ path: string, type?: 'bpmn'|'dmn'|'form' | 'rpa' }} files
   * @param {string} [tenantId]
   *
   * @returns {Array<Resource>}
   */
  _getResources(resourceConfigs, tenantId) {
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

  async getProcessInstance(config) {
    const { endpoint, processInstanceKey } = config;

    const camunda8Client = await this._getCamunda8Client(endpoint);

    const client = camunda8Client.getOperateApiClient();

    try {
      const getProcessInstanceRespoonse = await client.getProcessInstance(processInstanceKey);

      const { key } = getProcessInstanceRespoonse;

      const getVariablesForProcessResponse = await client.getJSONVariablesforProcess(key);

      return {
        success: true,
        response: {
          processInstance: getProcessInstanceRespoonse,
          variables: getVariablesForProcessResponse
        }
      };
    } catch (err) {
      this._log.error('get process instance failed', err);

      return {
        success: false,
        response: asSerializedError(err)
      };
    }
  }
}

module.exports = ZeebeAPI;


// helpers //////////

/**
 * @param {string} message
 *
 * @returns {number|undefined}
 */
function getErrorCode(message) {

  if (message.includes('13 INTERNAL:')) {
    return 13;
  }

  if (message.includes('14 UNAVAILABLE:')) {
    return 14;
  }
}

function getErrorReason(error, endpoint) {

  const {
    message,
    code = message && getErrorCode(message)
  } = error;

  const {
    type,
    authType = AUTH_TYPES.NONE
  } = endpoint;

  // (1) handle grpc errors
  if (code === 14 || code === 13) {
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

function isHashEqual(parameter1, parameter2) {
  return JSON.stringify(parameter1) === JSON.stringify(parameter2);
}

function asSerializedError(error) {
  return pick(error, [ 'message', 'code', 'details' ]);
}

/**
 * Filter endpoint connection parameters, so they can safely logged
 * without leaking secrets.
 *
 * @param {any} parameters
 *
 * @returns {any} filtered parameters
 */
function filterEndpointParameters(parameters) {
  return filterRecursive(parameters, [
    'clientSecret:secret',
    'basicAuthPassword:secret'
  ]);
}

/**
 * Filter Camunda8 options, so they can safely logged
 * without leaking secrets.
 *
 * @param {any} options
 *
 * @returns {any} filtered options
 */
function filterCamunda8Options(options) {
  return filterRecursive(options, [
    'ZEEBE_CLIENT_SECRET:secret',
    'CAMUNDA_CONSOLE_CLIENT_SECRET:secret',
    'CAMUNDA_BASIC_AUTH_PASSWORD:secret',
    'CAMUNDA_CUSTOM_ROOT_CERT_STRING:blob'
  ]);
}

function filterRecursive(obj, keys) {

  const overrides = keys.reduce((overrides, name) => {
    const [ key, type ] = name.split(':');

    overrides[key] = type;

    return overrides;
  }, {});

  return JSON.parse(
    JSON.stringify(obj, (key, value) => {
      const override = overrides[key];

      if (override === 'secret') {
        return '******';
      }

      if (override === 'blob') {
        return '...';
      }

      return value;
    })
  );
}

function removeProtocol(url) {
  return url.replace(/^(https?:\/\/|grpcs?:\/\/)/, '');
}
