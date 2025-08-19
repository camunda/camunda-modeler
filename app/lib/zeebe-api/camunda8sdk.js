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

/**
 * @typedef {import('@camunda8/sdk/dist/c8').Camunda8} Camunda8
 * @typedef {typeof import('@camunda8/sdk').Camunda8} Camunda8Constructor
 * @typedef {import('@camunda8/sdk/dist/zeebe').ZeebeGrpcClient} ZeebeGrpcClient
 */

class Camunda8SdkClients {

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

    /** @type {'rest'|'grpc'} */
    this._protocol = 'rest';
  }

  /**
   * @param {import("./endpoints").Endpoint} endpoint
   */
  async getCamundaClient(endpoint) {
    const cachedCamundaClient = this._getCachedCamundaClient(endpoint);

    if (cachedCamundaClient) {
      return cachedCamundaClient;
    }

    this._camundaClient.closeAllClients();

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

    if (this._protocol === 'grpc') {
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
    } = endpoint;

    if (!values(ENDPOINT_TYPES).includes(type) || !values(AUTH_TYPES).includes(authType)) {

      // TODO(nikku): this should throw an error as consumers of this method
      //   _never_ handle a null zeebe client appropriately
      return;
    }


    const clientConfig = await this._getClientConfig(endpoint);
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

    // TODO(@Buckwich): determine protocol based on cluster
    this._protocol = url.match(/^(https?|grpcs?):\/\//)?.[1];
    if (!this._protocol) {
      throw new Error(`URL with Protocol required: ${url}`);
    }

    if (this._protocol === 'grpc') {
      clientConfig.ZEEBE_GRPC_ADDRESS = url ? removeProtocol(url) : '';
      clientConfig.zeebeGrpcSettings = {
        ZEEBE_GRPC_CLIENT_RETRY: false
      };
    }
    else {
      clientConfig.ZEEBE_REST_ADDRESS = url;
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

}

function isHashEqual(parameter1, parameter2) {
  return JSON.stringify(parameter1) === JSON.stringify(parameter2);
}

function removeProtocol(url) {
  return url.replace(/^(https?:\/\/|grpcs?:\/\/)/, '');
}

module.exports = Camunda8SdkClients;
