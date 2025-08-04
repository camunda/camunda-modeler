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

const { satisfies } = require('semver');

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
 * @typedef {import('@camunda8/sdk/dist/zeebe').CamundaRestClient} CamundaRestClient
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
     * @type { ZeebeGrpcClient }
     */
    this._zeebeClient = null;
  }

  /**
   * Check connection with given endpoint.
   *
   * @param {{ endpoint: Endpoint }} endpointConfig
   *
   * @returns {Promise<{ success: boolean, reason?: string }>}
   */
  async checkConnection(endpointConfig) {
    const { endpoint } = endpointConfig;

    const client = await this._getZeebeClient(endpoint);

    this._log.debug('check connection', {
      config: redactEndpointConfig(endpointConfig)
    });

    try {
      await client.getTopology();
      return { success: true };
    } catch (err) {
      this._log.error('connection check failed', {
        config: redactEndpointConfig(endpointConfig)
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
   * @param {DeploymentConfig} deployConfig
   *
   * @returns {Promise<{ success: boolean, response: object }>}
   */
  async deploy(deployConfig) {
    const {
      endpoint,
      resourceConfigs,
      tenantId
    } = deployConfig;

    this._log.debug('deploy', {
      config: redactEndpointConfig(deployConfig)
    });

    const client = await this._getZeebeClient(endpoint);

    try {


      const resources = this._getResources(resourceConfigs);


      this._log.debug('deploying resources', resources);

      const response = await client.deployResources(resources, tenantId);


      return {
        success: true,
        response: response
      };
    } catch (err) {
      this._log.error('deploy failed', redactEndpointConfig(deployConfig), err);

      return {
        success: false,
        response: asSerializedError(err)
      };
    }
  }

  /**
   * Start instance of process with given process ID and configuration.
   *
   * @param {StartInstanceConfig} startInstanceConfig
   *
   * <BOOKMARK B>
   * @returns {{ success: boolean, response: object }}
   */
  async startInstance(startInstanceConfig) {
    const {
      endpoint,
      variables,
      processId,
      tenantId
    } = startInstanceConfig;

    this._log.debug('start instance', {
      config: redactEndpointConfig(startInstanceConfig)
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
      this._log.error('start instance failed', {
        config: redactEndpointConfig(startInstanceConfig)
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
   * @param {{ endpoint: Endpoint }} endpointConfig
   *
   * @returns {Promise<{ success: boolean, response?: object, response?.gatewayVersion: string }>}
   */
  async getGatewayVersion(endpointConfig) {
    const {
      endpoint
    } = endpointConfig;

    this._log.debug('fetch gateway version', {
      config: redactEndpointConfig(endpointConfig)
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
        config: redactEndpointConfig(endpointConfig)
      }, err);

      return {
        success: false,
        reason: getErrorReason(err, endpointConfig.endpoint)
      };
    }
  }

  _getCachedZeebeClient(endpoint) {
    const cachedEndpoint = this._cachedEndpoint;

    if (isHashEqual(endpoint, cachedEndpoint)) {
      return this._zeebeClient;
    }
  }

  /**
   * @param {Endpoint} endpoint
   */
  async _getZeebeClient(endpoint) {

    // (1) use existing Zeebe Client for endpoint
    const cachedZeebeClient = this._getCachedZeebeClient(endpoint);

    if (cachedZeebeClient) {
      return cachedZeebeClient;
    }

    // (2) cleanup old client instance
    this._shutdownZeebeGrpcClientInstance();

    // (3) create new Zeebe Client for endpoint configuration
    this._zeebeClient = await this._createZeebeClient(endpoint);
    this._cachedEndpoint = endpoint;

    return this._zeebeClient;
  }

  _shutdownZeebeGrpcClientInstance() {

    if (this._zeebeClient) {
      this._log.debug('shutdown zeebe grpc client');

      this._zeebeClient.close();
    }
  }

  /**
   * @param {Endpoint} endpoint
   *
   * @returns { Promise<ZeebeGrpcClient|CamundaRestClient> }
   */
  async _createZeebeClient(endpoint) {
    const {
      type,
      authType = AUTH_TYPES.NONE,
      url
    } = endpoint;

    /** @type {import('@camunda8/sdk').CamundaSDKConfiguration} */
    let clientConfig = {
      ZEEBE_GRPC_ADDRESS: endpoint.url ? removeProtocol(endpoint.url) : '',
      ZEEBE_REST_ADDRESS: endpoint.url,
      zeebeGrpcSettings: { ZEEBE_GRPC_CLIENT_RETRY: false }
    };

    if (!values(ENDPOINT_TYPES).includes(type) || !values(AUTH_TYPES).includes(authType)) {

      // TODO(nikku): this should throw an error as consumers of this method
      //   _never_ handle a null zeebe client appropriately
      return;
    }

    if (authType === AUTH_TYPES.NONE) {
      clientConfig = {
        ...clientConfig,
        CAMUNDA_OAUTH_DISABLED: true,
        CAMUNDA_AUTH_STRATEGY: 'NONE'
      };
    }
    if (authType === AUTH_TYPES.BASIC) {
      clientConfig = {
        ...clientConfig,
        CAMUNDA_AUTH_COOKIE_URL:'http://localhost:8080/api/login',
        CAMUNDA_AUTH_COOKIE_USERNAME: endpoint.basicAuthUsername,
        CAMUNDA_AUTH_COOKIE_PASSWORD: endpoint.basicAuthPassword,
      };
    } else if (authType === AUTH_TYPES.OAUTH) {
      clientConfig = {
        ...clientConfig,
        CAMUNDA_AUTH_STRATEGY: 'OAUTH',
        ZEEBE_CLIENT_ID: endpoint.clientId,
        ZEEBE_CLIENT_SECRET: endpoint.clientSecret,
        CAMUNDA_OAUTH_URL: endpoint.oauthURL,
        CAMUNDA_TOKEN_SCOPE: endpoint.scope,
        CAMUNDA_ZEEBE_OAUTH_AUDIENCE: endpoint.audience,
        CAMUNDA_TOKEN_DISK_CACHE_DISABLE: true
      };
    } else if (type === ENDPOINT_TYPES.CAMUNDA_CLOUD) {
      clientConfig = {
        ...clientConfig,
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
      clientConfig = {
        ...clientConfig,
        CAMUNDA_OAUTH_DISABLED: true,
      };
    }

    clientConfig = await this._withTLSConfig(url, clientConfig);

    // do not override camunda cloud port (handled by the client)
    if (type !== ENDPOINT_TYPES.CAMUNDA_CLOUD) {
      clientConfig = this._withPortConfig(url, clientConfig);
    }

    this._log.info('creating client', {
      url,
      clientConfig: redactCamunda8Config(clientConfig)
    });

    const camundaClient = new this._Camunda8(clientConfig);
    const grpcClient = camundaClient.getZeebeGrpcApiClient();
    grpcClient.getTopology = grpcClient.topology;
    if (endpoint.url.startsWith('grpc'))
    {
      this._log.info('using grpc client');
      return grpcClient;
    }
    const restClient = camundaClient.getCamundaRestClient();
    const { gatewayVersion } = await restClient.getTopology();
    this._log.info('cluster is using ', gatewayVersion);
    const restDeploymentSupported = satisfies(gatewayVersion,'>=8.6');
    if (restDeploymentSupported) {
      this._log.info('using rest client');
      return restClient;
    }
    this._log.info('fallback using grpc client');
    return grpcClient;
  }

  async _withTLSConfig(url, config) {
    const rootCerts = [];

    // (0) set `useTLS` according to the protocol
    const tlsConfig = {
      CAMUNDA_SECURE_CONNECTION: config.CAMUNDA_SECURE_CONNECTION || /^https:\/\//.test(url)

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
      return { ...config, ...tlsConfig };
    }

    const rootCertsBuffer = Buffer.from(rootCerts.join('\n'));

    return {
      ...config,
      ...tlsConfig,
      CAMUNDA_CUSTOM_ROOT_CERT_STRING: rootCertsBuffer
    };
  }

  _withPortConfig(url, config) {

    // do not override camunda cloud port (handled by zeebe-node)
    if (config.camundaCloud) {
      return config;
    }

    const parsedUrl = new URL(url);

    // do not override port if already set in url
    if (parsedUrl.port) {
      return config;
    }

    return {
      ...config,
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
   * Get resources based on the provided configs.
   *
   * @param {Array<{ path: string, type?: 'bpmn'|'dmn'|'form' | 'rpa' }} resourceConfigs
   *
   * @returns {Array<Resource>}
   */
  _getResources(resourceConfigs) {
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
 * Filter endpoint connection from config, so they can safely be logged
 * without leaking secrets.
 *
 * @template {Object} T
 * @param {T} config
 *
 * @returns {T} filtered config
 */
function redactEndpointConfig(config) {
  return redactDeep(config, [
    'clientSecret:secret',
    'basicAuthPassword:secret'
  ]);
}

/**
 * Filter Camunda8 client config, so they can safely logged
 * without leaking secrets.
 *
 * @template {Object} T
 * @param {T} config
 *
 * @returns {T} filtered config
 */
function redactCamunda8Config(config) {
  return redactDeep(config, [
    'ZEEBE_CLIENT_SECRET:secret',
    'CAMUNDA_CONSOLE_CLIENT_SECRET:secret',
    'CAMUNDA_BASIC_AUTH_PASSWORD:secret',
    'CAMUNDA_CUSTOM_ROOT_CERT_STRING:blob'
  ]);
}

/**
 * Redact sensitive information from an object deeply.
 *
 * @template {Object} T
 * @param {T} obj Object to redact
 * @param {Array<string>} keys - Array of keys to redact, in the format 'key:type'. type can be 'secret' or 'blob'.
 * @returns {T} Redacted object
 */
function redactDeep(obj, keys) {

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
