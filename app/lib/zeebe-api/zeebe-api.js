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
 * @typedef {Object} ZeebeClientParameters
 * @property {Endpoint} endpoint
 */

/**
 * @typedef {SelfHostedNoAuthEndpoint|SelfHostedBasicAuthEndpoint|SelfHostedOAuthEndpoint|CamundaCloudEndpoint} Endpoint
 */

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
 * @property {string} clusterId
 * @property {string} clientId
 * @property {string} clientSecret
 * @property {string} [clusterRegion] if not provided, zeebe-node will assume 'bru-2'
 */

/**
 * @typedef {Object} TopologyResponse
 * @property {'brokers'} type
 * @property {number} clusterSize
 * @property {number} partitionsCount
 * @property {number} replicationFactor
 * @property {string} gatewayVersion
 */

/**
 * @typedef { typeof import('@camunda8/sdk').Camunda8 } Camunda8Constructor
 * @typedef { import('@camunda8/sdk/dist/zeebe').ZeebeGrpcClient } ZeebeGrpcClient
 */

class ZeebeAPI {

  /**
   * @param { any } fs
   * @param { Camunda8Constructor } Camunda8
   * @param { any } flags
   * @param { any } [log]
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
     * @type { ZeebeGrpcClient }
     */
    this._zeebeClient = null;
  }

  /**
   * @public
   * Check connection with given broker/cluster.
   *
   * @param {ZeebeClientParameters} parameters
   *
   * @return {{ success: boolean, reason?: string }}
   */
  async checkConnection(parameters) {

    const {
      endpoint
    } = parameters;

    const client = await this._getZeebeClient(endpoint);

    this._log.debug('check connection', {
      parameters: filterEndpointParameters(parameters)
    });

    try {
      await client.topology();
      return { success: true };
    } catch (err) {
      this._log.error('connection check failed', {
        parameters: filterEndpointParameters(parameters)
      }, err);

      return {
        success: false,
        reason: getErrorReason(err, endpoint)
      };
    }
  }

  /**
   * @public
   * Deploy Process.
   *
   * @param {ZeebeClientParameters & { name: string, filePath: string }} parameters
   *
   * @return {Promise<{ success: boolean, response: object }>}
   */
  async deploy(parameters) {

    const {
      endpoint,
      filePath,
      name,
      resourceType = 'bpmn'
    } = parameters;

    const {
      contents
    } = this._fs.readFile(filePath, { encoding: false });

    this._log.debug('deploy', {
      parameters: filterEndpointParameters(parameters)
    });

    const client = await this._getZeebeClient(endpoint);

    try {
      const resourceName = this._prepareDeploymentName(name, filePath, resourceType);

      const resource = getResource(parameters, contents, resourceName);

      this._log.debug('deploying resource', resource);

      const response = await client.deployResource(resource);

      return {
        success: true,
        response: response
      };
    } catch (err) {
      this._log.error('deploy failed', filterEndpointParameters(parameters), err);

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
   * @param {ZeebeClientParameters & { endpoint: object, processId: string, variables: object }} parameters
   *
   * @return {{ success: boolean, response: object }}
   */
  async run(parameters) {

    const {
      endpoint,
      variables,
      processId,
      tenantId
    } = parameters;

    this._log.debug('run', {
      parameters: filterEndpointParameters(parameters)
    });

    const client = await this._getZeebeClient(endpoint);

    try {

      const response = await client.createProcessInstance({
        bpmnProcessId: processId,
        variables,
        tenantId
      });

      return {
        success: true,
        response: response
      };
    } catch (err) {
      this._log.error('run failed', {
        parameters: filterEndpointParameters(parameters)
      }, err);

      return {
        success: false,
        response: asSerializedError(err)
      };
    }
  }

  /**
   * @public
   * Get gateway version of given broker/cluster endpoint.
   *
   * @param {ZeebeClientParameters} parameters
   *
   * @return {{ success: boolean, response?: object, response?.gatewayVersion: string }}
   */
  async getGatewayVersion(parameters) {

    const {
      endpoint
    } = parameters;

    this._log.debug('fetch gateway version', {
      parameters: filterEndpointParameters(parameters)
    });

    const client = await this._getZeebeClient(endpoint);

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
        parameters: filterEndpointParameters(parameters)
      }, err);

      return {
        success: false,
        reason: getErrorReason(err, endpoint)
      };
    }
  }

  _getCachedZeebeClient(endpoint) {
    const cachedEndpoint = this._cachedEndpoint;

    if (isHashEqual(endpoint, cachedEndpoint)) {
      return this._zeebeClient;
    }
  }

  async _getZeebeClient(endpoint) {

    // (1) use existing Zeebe Client for endpoint
    const cachedZeebeClient = this._getCachedZeebeClient(endpoint);

    if (cachedZeebeClient) {
      return cachedZeebeClient;
    }

    // (2) cleanup old client instance
    this._shutdownZeebeClientInstance();

    // (3) create new Zeebe Client for endpoint configuration
    this._zeebeClient = await this._createZeebeClient(endpoint);
    this._cachedEndpoint = endpoint;

    return this._zeebeClient;
  }

  _shutdownZeebeClientInstance() {

    if (this._zeebeClient) {
      this._log.debug('shutdown zeebe client');

      this._zeebeClient.close();
    }
  }

  /**
   * @param {any} endpoint
   *
   * @return { Promise<ZeebeGrpcClient> }
   */
  async _createZeebeClient(endpoint) {
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
        CAMUNDA_CONSOLE_OAUTH_AUDIENCE: endpoint.audience,
        CAMUNDA_TOKEN_DISK_CACHE_DISABLE: true
      };
    } else if (type === ENDPOINT_TYPES.CAMUNDA_CLOUD) {
      options = {
        ...options,
        CAMUNDA_AUTH_STRATEGY: 'OAUTH',
        CAMUNDA_OAUTH_URL: 'https://login.cloud.camunda.io/oauth/token',
        CAMUNDA_CONSOLE_OAUTH_AUDIENCE: endpoint.audience,
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

    const camundaClient = new this._Camunda8(options);

    return camundaClient.getZeebeGrpcApiClient();
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
   * With zeebe-node 0.23.0, the deployment name should end with
   * file type appropriate suffix.
   *
   * If name is empty, we'll return the file name with suffix added. If name is not empty
   * but does not end with .bpmn, we'll add the suffix.
   *
   * @param {string} name
   * @param {string} filePath
   * @param {'bpmn'|'dmn'|'form'} [fileType='bpmn']
   *
   * @return {`${string}.${'bpmn'|'dmn'|'form'}`}
   */
  _prepareDeploymentName(name, filePath, fileType = 'bpmn') {

    const extension = `.${ fileType }`;

    try {
      if (!name || name.length === 0) {
        return `${ path.basename(filePath, path.extname(filePath)) }${ extension }`;
      }

      if (!name.endsWith(extension)) {
        return `${ name }${ extension }`;
      }

    } catch (err) {

      this._log.error('prepare deployment name failed', err);
    }

    return name;
  }
}

module.exports = ZeebeAPI;


// helpers //////////

/**
 * @param {string} message
 *
 * @return {number|undefined}
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
 * @return {any} filtered parameters
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
 * @return {any} filtered options
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

function getResource(parameters, contents, resourceName) {
  const {
    resourceType = 'bpmn',
    tenantId
  } = parameters;

  const resource = {
    name: resourceName
  };

  if (resourceType === RESOURCE_TYPES.BPMN) {
    resource.process = contents;
  } else if (resourceType === RESOURCE_TYPES.DMN) {
    resource.decision = contents;
  } else if (resourceType === RESOURCE_TYPES.FORM) {
    resource.form = contents;
  } else {

    // Fallback for unknown resource, cf.
    // https://github.com/camunda-community-hub/zeebe-client-node-js/blob/7969ce1808c96a87519cb1a3f279287f30637c4b/src/zb/ZBClient.ts#L873-L886

    resource.form = contents;
  }

  if (tenantId) {
    resource.tenantId = tenantId;
  }

  return resource;
}

function removeProtocol(url) {
  return url.replace(/^(https?:\/\/|grpcs?:\/\/)/, '');
}
