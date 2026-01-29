/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const createLog = require('../log');
const { X509Certificate } = require('node:crypto');
const getSystemCertificates = require('./get-system-certificates');

const path = require('path');
const { values } = require('min-dash');

const {
  AUTH_TYPES,
  ENDPOINT_TYPES
} = require('./constants');

const {
  sanitizeCamundaClientOptions,
  isGrpcSaasUrl,
  isRestSaasUrl,
  removeV2OrSlashes
} = require('./utils');

/**
 * @typedef {import('@camunda8/sdk/dist/c8').Camunda8} Camunda8
 * @typedef {typeof import('@camunda8/sdk').Camunda8} Camunda8Constructor
 * @typedef {import('@camunda8/sdk/dist/zeebe').ZeebeGrpcClient} ZeebeGrpcClient
 */

/**
 * A factory for Camunda 8 SDK clients that caches a single client for the
 * endpoint that was last requested. If a different endpoint is requested, a new
 * client is created.
 */
class CamundaClientFactory {

  /**
   * @param { {
   *   readFile: (path: string, options?: { encoding: boolean }) => { contents: string },
   * } } fs
   * @param {Camunda8Constructor} Camunda8
   * @param {any} flags
   * @param {any} [log]
   */
  constructor(fs, Camunda8, flags, log = createLog('app:camunda-api')) {
    this._fs = fs;

    /**
     * @type {Camunda8Constructor}
     */
    this._Camunda8 = Camunda8;
    this._flags = flags;
    this._log = log;

    /** @type {Camunda8} */
    this._cachedClient = null;

    /** @type {import("./endpoints").Endpoint} */
    this._cachedEndpoint = null;

    /** @type {'http'|'https'|'grpc'|'grpcs'} */
    this._cachedProtocol = 'grpc';
  }

  /**
   * @param {import("./endpoints").Endpoint} endpoint
   */
  async getCamundaClient(endpoint) {
    const protocol = await this._getProtocol(endpoint);

    if (this._isCacheValid(endpoint, protocol)) {
      return this._cachedClient;
    }

    this._cachedClient?.closeAllClients();

    this._cachedProtocol = protocol;
    this._cachedClient = await this._createCamundaClient(endpoint);
    this._cachedEndpoint = endpoint;

    return this._cachedClient;
  }

  /**
   * @param {import("./endpoints").Endpoint} endpoint
   *
   * @returns {Promise<{ zeebeGrpcClient?: ZeebeGrpcClient, camundaRestClient?: import('@camunda8/sdk').CamundaRestClient}>}
   */
  async getSupportedCamundaClients(endpoint) {
    const camundaClient = await this.getCamundaClient(endpoint);

    if ([ 'grpc', 'grpcs' ].includes(this._cachedProtocol)) {
      return {
        zeebeGrpcClient: camundaClient.getZeebeGrpcApiClient()
      };
    }
    else {
      const clients = {
        camundaRestClient: camundaClient.getCamundaRestClient(),
      };
      return clients;
    }
  }

  /**
   * Get the appropriate protocol (gRPC or REST) for the endpoint.
   *
   * @param {import("./endpoints").Endpoint} endpoint
   *
   * @returns {Promise<'grpc'|'grpcs'|'http'|'https'>}
   */
  async _getProtocol(endpoint) {
    const matchedProtocol = endpoint.url.match(/^(https?|grpcs?):\/\//)?.[1];

    if (!matchedProtocol) {
      return 'grpc';
    }

    // Use explicit gRPC protocol from URL
    if (matchedProtocol && [ 'grpc', 'grpcs' ].includes(matchedProtocol)) {
      return matchedProtocol;
    }

    // For SaaS, get protocol from URL
    if (endpoint.type === ENDPOINT_TYPES.CAMUNDA_CLOUD) {
      if (isGrpcSaasUrl(endpoint.url)) {
        return 'grpcs';
      } else if (isRestSaasUrl(endpoint.url)) {
        return 'https';
      }
    }

    // Test REST first, fallback to gRPC
    const isSecure = matchedProtocol === 'https';

    const grpcProtocol = isSecure ? 'grpcs' : 'grpc';

    if (await this._canConnectWithProtocol(endpoint, matchedProtocol)) {
      return matchedProtocol;
    }

    return grpcProtocol;
  }

  /**
   * Check if the endpoint can be connected with the specified protocol.
   *
   * @param {import("./endpoints").Endpoint} endpoint
   * @param {'grpc'|'grpcs'|'http'|'https'} protocol
   *
   * @returns {Promise<boolean>}
   */
  async _canConnectWithProtocol(endpoint, protocol) {
    try {

      // Temporarily set the protocol for testing
      const originalProtocol = this._cachedProtocol;
      this._cachedProtocol = protocol;

      // Create a test client with the specific protocol
      const testClient = await this._createCamundaClient(endpoint);

      if ([ 'grpc', 'grpcs' ].includes(protocol)) {
        const zeebeClient = testClient.getZeebeGrpcApiClient();
        await zeebeClient.topology();
      } else {
        const restClient = testClient.getCamundaRestClient();
        await restClient.getTopology();
      }

      testClient.closeAllClients();

      // Restore original protocol
      this._cachedProtocol = originalProtocol;

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Checks if the current cache is valid for the given endpoint and protocol
   * @param {import("./endpoints").Endpoint} endpoint
   * @param {'grpc'|'grpcs'|'http'|'https'} protocol
   * @returns {boolean}
   */
  _isCacheValid(endpoint, protocol) {
    return this._cachedClient &&
           this._cachedProtocol === protocol &&
           this._isEndpointEqual(endpoint, this._cachedEndpoint);
  }

  /**
   * Check if two endpoints are equal.
   *
   * @param {import("./endpoints").Endpoint} endpoint1
   * @param {import("./endpoints").Endpoint} endpoint2
   *
   * @returns {boolean}
   */
  _isEndpointEqual(endpoint1, endpoint2) {
    if (!endpoint1 || !endpoint2) return false;

    const keys1 = Object.keys(endpoint1);
    const keys2 = Object.keys(endpoint2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
      if (endpoint1[key] !== endpoint2[key]) return false;
    }

    return true;
  }

  /**
   * @param {import("./endpoints").Endpoint} endpoint
   */
  async _createCamundaClient(endpoint) {
    const {
      type,
      authType = AUTH_TYPES.NONE,
      url
    } = endpoint;

    if (!values(ENDPOINT_TYPES).includes(type) || !values(AUTH_TYPES).includes(authType)) {

      // TODO(nikku): this should throw an error as consumers of this method
      // _never_ handle a null zeebe client appropriately
      return;
    }

    const clientConfig = await this._getClientConfig(endpoint);

    this._log.debug('creating client', {
      url,
      options: sanitizeCamundaClientOptions(clientConfig)
    });

    return new this._Camunda8(clientConfig);
  }

  async _getClientConfig(endpoint) {

    const {
      type,
      authType = AUTH_TYPES.NONE,
      url
    } = endpoint;

    /** @type {import('@camunda8/sdk/dist/lib').Camunda8ClientConfiguration} */
    let clientConfig = {};

    if (endpoint.tenantId) {
      clientConfig.CAMUNDA_TENANT_ID = endpoint.tenantId;
    }

    switch (this._cachedProtocol) {
    case 'grpc':
    case 'grpcs':
      clientConfig.ZEEBE_GRPC_ADDRESS = url ? overwriteProtocol(url, this._cachedProtocol) : '';
      clientConfig.zeebeGrpcSettings = {
        ZEEBE_GRPC_CLIENT_RETRY: false
      };
      break;

    case 'http':
    case 'https':
    default:
      clientConfig.ZEEBE_REST_ADDRESS = removeV2OrSlashes(url);
      break;
    }

    if (authType === AUTH_TYPES.BASIC) {
      clientConfig = {
        ...clientConfig,
        CAMUNDA_AUTH_STRATEGY: 'BASIC',
        CAMUNDA_BASIC_AUTH_USERNAME: endpoint.basicAuthUsername,
        CAMUNDA_BASIC_AUTH_PASSWORD: endpoint.basicAuthPassword
      };
    } else if (authType === AUTH_TYPES.BEARER) {
      clientConfig = {
        ...clientConfig,
        CAMUNDA_AUTH_STRATEGY: 'BEARER',
        CAMUNDA_TOKEN_VALUE: endpoint.token
      };
    } else if (authType === AUTH_TYPES.OIDC) {
      // OIDC uses bearer token after protocol handler callback
      clientConfig = {
        ...clientConfig,
        CAMUNDA_AUTH_STRATEGY: 'BEARER',
        CAMUNDA_TOKEN_VALUE: endpoint.token
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

    return clientConfig;
  }

  async _withTLSConfig(url, options) {
    const rootCerts = [];


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
      return options;
    }

    const rootCertsBuffer = Buffer.from(rootCerts.join('\n'));

    return {
      ...options,
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
      port: parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'grpcs:' ? '443' : '80'
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

}

/**
 * Overwrite the protocol (http://, https://, etc.) from a URL.
 *
 * @example
 *
 * overwriteProtocol('https://example.com', 'grpcs') // returns 'grpcs://example.com'
 *
 * @param {string} url
 * @param {'http'|'https'|'grpc'|'grpcs'} protocol
 *
 * @returns {string}
 */
function overwriteProtocol(url, protocol) {
  return url.replace(/^(https?:\/\/|grpcs?:\/\/)/, protocol + '://');
}

module.exports = CamundaClientFactory;

