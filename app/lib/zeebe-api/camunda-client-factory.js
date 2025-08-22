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
const { redactCamunda8Options, isGrpcSaasUrl, isRestSaasUrl } = require('./utils');

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
    this._camundaClient = null;
    this._endpoint = undefined;

    /** @type {'http'|'https'|'grpc'|'grpcs'} */
    this._protocol = 'grpc';
  }

  /**
   * @param {import("./endpoints").Endpoint} endpoint
   */
  async getCamundaClient(endpoint) {
    const cachedCamundaClient = this._getCachedCamundaClient(endpoint);

    if (cachedCamundaClient) {
      return cachedCamundaClient;
    }

    this._camundaClient?.closeAllClients();

    this._protocol = await this._determineProtocol(endpoint);
    this._camundaClient = await this._createCamundaClient(endpoint);
    this._cachedEndpoint = endpoint;

    return this._camundaClient;
  }

  /**
   * @param {import("./endpoints").Endpoint} endpoint
   *
   * @returns {Promise<{ zeebeGrpcClient?: ZeebeGrpcClient, camundaRestClient?: import('@camunda8/sdk').CamundaRestClient}>}
   */
  async getSupportedCamundaClients(endpoint) {
    const camundaClient = await this.getCamundaClient(endpoint);

    if ([ 'grpc', 'grpcs' ].includes(this._protocol)) {
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
   * Determines the protocol to use based on URL and optionally testing connections
   * @param {import("./endpoints").Endpoint} endpoint
   * @returns {Promise<'grpc'|'grpcs'|'http'|'https'>}
   */
  async _determineProtocol(endpoint) {

    const urlProtocol = endpoint.url.match(/^(https?|grpcs?):\/\//)?.[1];

    // if grpc is part of URL we can directly use it
    if (urlProtocol && [ 'grpc', 'grpcs' ].includes(urlProtocol)) {
      return urlProtocol;
    }

    // for SaaS we can determine the protocol from the URL pattern
    if (endpoint.type === ENDPOINT_TYPES.CAMUNDA_CLOUD) {
      if (isGrpcSaasUrl(endpoint.url)) {
        return 'grpcs';
      }
      if (isRestSaasUrl(endpoint.url)) {
        return 'https';
      }
    }

    // test for rest connection, fallback to grpc if it fails
    const isSecure = urlProtocol === 'https';
    const grpcProtocol = isSecure ? 'grpcs' : 'grpc';
    if (await this._testProtocol(endpoint, urlProtocol)) {
      return urlProtocol;
    }
    return grpcProtocol;
  }

  /**
   * Tests if a specific protocol works for the given endpoint
   * @param {import("./endpoints").Endpoint} endpoint
   * @param {'grpc'|'grpcs'|'http'|'https'} protocol
   * @returns {Promise<boolean>}
   */
  async _testProtocol(endpoint, protocol) {
    try {

      // Temporarily set the protocol for testing
      const originalProtocol = this._protocol;
      this._protocol = protocol;

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
      this._protocol = originalProtocol;

      return true;
    } catch (error) {
      return false;
    }
  }

  _getCachedCamundaClient(endpoint) {
    const cachedEndpoint = this._cachedEndpoint;

    if (isHashEqual(endpoint, cachedEndpoint)) {
      return this._camundaClient;
    }
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
      options: redactCamunda8Options(clientConfig)
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

    switch (this._protocol) {
    case 'grpc':
    case 'grpcs':
      clientConfig.ZEEBE_ADDRESS = url ? removeProtocol(url) : '';
      clientConfig.zeebeGrpcSettings = {
        ZEEBE_GRPC_CLIENT_RETRY: false
      };
      break;

    case 'http':
    case 'https':
    default:
      clientConfig.ZEEBE_REST_ADDRESS = url;
      break;
    }

    if (authType === AUTH_TYPES.BASIC) {
      clientConfig = {
        ...clientConfig,
        CAMUNDA_AUTH_STRATEGY: 'BASIC',
        CAMUNDA_BASIC_AUTH_USERNAME: endpoint.basicAuthUsername,
        CAMUNDA_BASIC_AUTH_PASSWORD: endpoint.basicAuthPassword
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

    return clientConfig;
  }

  async _withTLSConfig(url, options) {
    const rootCerts = [];

    // (0) set `useTLS` according to the protocol
    const tlsOptions = {
      CAMUNDA_SECURE_CONNECTION: options.CAMUNDA_SECURE_CONNECTION || /^(https|grpcs):\/\//.test(url)
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
 * Check if two objects are equal by comparing their JSON string representations.
 *
 * @param {Object} obj1
 * @param {Object} obj2
 *
 * @returns {boolean}
 */
function isHashEqual(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

/**
 * Remove the protocol (http://, https://, etc.) from a URL.
 *
 * @example
 *
 * removeProtocol('https://example.com') // returns 'example.com'
 *
 * @param {string} url
 *
 * @returns {string}
 */
function removeProtocol(url) {
  return url.replace(/^(https?:\/\/|grpcs?:\/\/)/, '');
}

module.exports = CamundaClientFactory;

