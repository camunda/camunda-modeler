/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const fs = require('fs');
const tls = require('tls');

const log = require('../log')('app:c8ctl');

const getSystemCertificates = require('../zeebe-api/get-system-certificates');

const TARGET_TYPES = {
  CAMUNDA_CLOUD: 'camundaCloud',
  SELF_HOSTED: 'selfHosted'
};

const AUTH_TYPES = {
  BASIC: 'basic',
  OAUTH: 'oauth'
};

const SAAS_OAUTH_URL = 'https://login.cloud.camunda.io/oauth/token';

/**
 * The reasons `zeebe-api` reports for failed calls; the renderer shows a
 * message per reason.
 */
const ERROR_REASONS = {
  UNKNOWN: 'UNKNOWN',
  CONTACT_POINT_UNAVAILABLE: 'CONTACT_POINT_UNAVAILABLE',
  UNAUTHORIZED: 'UNAUTHORIZED',
  CLUSTER_UNAVAILABLE: 'CLUSTER_UNAVAILABLE',
  CLUSTER_TEMPORARILY_UNAVAILABLE: 'CLUSTER_TEMPORARILY_UNAVAILABLE',
  FORBIDDEN: 'FORBIDDEN',
  OAUTH_URL: 'OAUTH_URL',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS'
};

/**
 * The only module that imports c8ctl. It turns Modeler endpoints into c8ctl
 * targets, passes the Modeler's context (data dir, certificates), and maps
 * c8ctl results and errors to the shapes `zeebe-api` returns, so the
 * renderer does not change.
 *
 * c8ctl talks to the REST API only; the caller routes gRPC endpoints to
 * `zeebe-api`.
 */
class C8ctl {

  /**
   * @param {object} options
   * @param {string} options.modelerDir - the Modeler user data directory
   * @param {{ get(name: string): unknown }} [options.flags]
   * @param {Function} [options.fetch] - fetch for cluster requests; default:
   *   one that trusts the Modeler's certificates
   * @param {Function} [options.loadApi] - loads `@camunda8/cli/internal`
   */
  constructor({
    modelerDir,
    flags = { get: () => undefined },
    fetch,
    loadApi = () => require('@camunda8/cli/internal')
  }) {
    this._modelerDir = modelerDir;
    this._flags = flags;
    this._loadApi = loadApi;
    this._api = null;
    this._fetch = fetch || null;
  }

  _getApi() {
    if (!this._api) {
      this._api = this._loadApi();
    }

    return this._api;
  }

  /**
   * Whether c8ctl can serve the endpoint: anything but an explicit gRPC URL.
   * The caller also checks that the endpoint resolves to REST.
   */
  canServe(endpoint) {
    return !!endpoint
      && !!endpoint.url
      && !/^grpcs?:\/\//i.test(endpoint.url);
  }

  async deploy({ endpoint, resourceConfigs }) {
    const api = this._getApi();

    try {
      const result = await api.deploy({
        target: toTarget(endpoint),
        paths: resourceConfigs.map(({ path }) => path),
        tenantId: endpoint.tenantId || undefined
      }, await this._context({
        onProgress: event => log.debug('deploy', event)
      }));

      return {
        success: true,
        response: toDeployResponse(result)
      };
    } catch (error) {
      return this._failure('deploy', error, { response: toErrorResponse(error) });
    }
  }

  async startInstance(config) {
    const {
      endpoint,
      variables,
      processDefinitionKey,
      processId,
      startInstructions,
      runtimeInstructions,
      businessId
    } = config;

    try {
      const response = await this._getApi().createProcessInstance({
        target: toTarget(endpoint),
        tenantId: endpoint.tenantId || undefined,
        ...(processDefinitionKey
          ? { processDefinitionKey }
          : { processDefinitionId: processId }),
        variables,
        startInstructions,
        runtimeInstructions,
        businessId
      }, await this._context());

      return { success: true, response };
    } catch (error) {
      return this._failure('start instance', error, { response: toErrorResponse(error) });
    }
  }

  /**
   * `zeebe:checkConnection` and `zeebe:getGatewayVersion`.
   */
  async getGatewayVersion({ endpoint }) {
    try {
      const topology = await this._getApi().getTopology({
        target: toTarget(endpoint)
      }, await this._context());

      return {
        success: true,
        response: {
          protocol: 'rest',
          gatewayVersion: topology.gatewayVersion
        }
      };
    } catch (error) {
      return this._failure('get gateway version', error, {
        reason: toErrorReason(error, endpoint)
      });
    }
  }

  searchProcessInstances({ endpoint, processInstanceKey, parentProcessInstanceKey }) {
    return this._search('searchProcessInstances', endpoint, {
      key: processInstanceKey,
      parentProcessInstanceKey
    });
  }

  searchVariables({ endpoint, processInstanceKey }) {
    return this._search('searchVariables', endpoint, {
      processInstanceKey,
      fullValue: true
    });
  }

  searchJobs({ endpoint, processInstanceKey }) {
    return this._search('searchJobs', endpoint, { processInstanceKey });
  }

  searchUserTasks({ endpoint, processInstanceKey }) {
    return this._search('searchUserTasks', endpoint, { processInstanceKey });
  }

  searchElementInstances({ endpoint, processInstanceKey }) {
    return this._search('searchElementInstances', endpoint, { processInstanceKey });
  }

  searchMessageSubscriptions({ endpoint, processInstanceKey }) {
    return this._search('searchMessageSubscriptions', endpoint, { processInstanceKey });
  }

  /**
   * Incidents of the process instance and of the instances it called.
   */
  searchIncidents({ endpoint, processInstanceKey }) {
    return this._search('searchIncidents', endpoint, {
      processInstanceKey,
      includeCalled: true
    });
  }

  async evaluateExpression({ endpoint, expression, variables }) {
    try {
      const response = await this._getApi().evaluateExpression({
        target: toTarget(endpoint),
        expression,
        variables
      }, await this._context());

      return { success: true, response };
    } catch (error) {
      return this._failure('evaluate expression', error, {
        reason: toErrorReason(error, endpoint)
      });
    }
  }

  async _search(operation, endpoint, filter) {
    try {
      const { items } = await this._getApi()[operation]({
        target: toTarget(endpoint),
        tenantId: endpoint.tenantId || undefined,
        ...filter
      }, await this._context());

      return { success: true, response: { items } };
    } catch (error) {
      return this._failure(operation, error, {
        reason: toErrorReason(error, endpoint)
      });
    }
  }

  async _context(options = {}) {
    return {
      modelerDir: this._modelerDir,
      fetch: await this._getFetch(),

      // fail an interactive call after one token attempt, not five with backoff
      env: { CAMUNDA_OAUTH_RETRY_MAX: '1' },
      sdkLogLevel: 'silent',
      ...options
    };
  }

  /**
   * A `fetch` that trusts the certificates `zeebe-api` trusts: the
   * `zeebe-ssl-certificate` flag and the OS keychain.
   */
  async _getFetch() {
    if (this._fetch) {
      return this._fetch;
    }

    const { Agent } = require('undici');

    const certificates = [ ...await getSystemCertificates() ];

    const customCertificatePath = this._flags.get('zeebe-ssl-certificate');

    if (customCertificatePath) {
      try {
        certificates.push(fs.readFileSync(customCertificatePath, 'utf8'));
      } catch (error) {
        log.error('failed to read zeebe-ssl-certificate', error);
      }
    }

    const dispatcher = new Agent({
      connect: {
        ca: certificates.length ? certificates : tls.rootCertificates
      }
    });

    this._fetch = (input, init) => fetch(input, { ...init, dispatcher });

    return this._fetch;
  }

  _failure(operation, error, result) {
    if (!this._getApi().isC8ctlError(error)) {
      throw error;
    }

    log.error(`${ operation } failed`, error.toJSON());

    return { success: false, ...result };
  }
}

module.exports = C8ctl;

/**
 * Calls only c8ctl serves; `zeebe-api` has no REST code for them, and gRPC
 * endpoints cannot serve them.
 */
const C8CTL_ONLY_CALLS = [
  'searchProcessInstances',
  'searchVariables',
  'searchJobs',
  'searchUserTasks',
  'searchElementInstances',
  'searchMessageSubscriptions',
  'searchIncidents',
  'evaluateExpression'
];

/**
 * Route a `zeebe:*` call: c8ctl for endpoints that resolve to REST,
 * `zeebe-api` (SDK) for gRPC.
 *
 * @param {C8ctl} c8ctl
 * @param {{ usesRest(endpoint: object): Promise<boolean> }} zeebeAPI
 *
 * @returns {(method: string, options: { endpoint: object }) => Promise<object>}
 */
module.exports.createZeebeRouter = function createZeebeRouter(c8ctl, zeebeAPI) {
  return async function route(method, options) {
    const { endpoint } = options;

    const useC8ctl = c8ctl.canServe(endpoint) && await zeebeAPI.usesRest(endpoint);

    log.debug(`zeebe:${ method } via ${ useC8ctl ? 'c8ctl' : 'zeebe-api' }`);

    if (useC8ctl) {
      return method === 'checkConnection'
        ? c8ctl.getGatewayVersion(options)
        : c8ctl[method](options);
    }

    if (C8CTL_ONLY_CALLS.includes(method)) {
      return { success: false, reason: ERROR_REASONS.UNKNOWN };
    }

    return zeebeAPI[method](options);
  };
};

/**
 * @param {object} endpoint - an endpoint from the renderer
 *
 * @returns {{ cluster: object }} c8ctl target
 */
function toTarget(endpoint) {
  return { cluster: toClusterConfig(endpoint) };
}

function toClusterConfig(endpoint) {
  const { authType, type, url } = endpoint;

  if (type === TARGET_TYPES.CAMUNDA_CLOUD) {
    return {
      baseUrl: url,
      authStrategy: 'OAUTH',
      clientId: endpoint.clientId,
      clientSecret: endpoint.clientSecret,
      oAuthUrl: SAAS_OAUTH_URL,
      audience: endpoint.audience,
      scope: endpoint.scope
    };
  }

  if (authType === AUTH_TYPES.BASIC) {
    return {
      baseUrl: url,
      authStrategy: 'BASIC',
      username: endpoint.basicAuthUsername,
      password: endpoint.basicAuthPassword
    };
  }

  if (authType === AUTH_TYPES.OAUTH) {
    return {
      baseUrl: url,
      authStrategy: 'OAUTH',
      clientId: endpoint.clientId,
      clientSecret: endpoint.clientSecret,
      oAuthUrl: endpoint.oauthURL,
      audience: endpoint.audience,
      scope: endpoint.scope
    };
  }

  return {
    baseUrl: url,
    authStrategy: 'NONE'
  };
}

/**
 * Map a c8ctl error code to the reason `zeebe-api` would report.
 */
function toErrorReason(error, endpoint) {
  const saas = endpoint.type === TARGET_TYPES.CAMUNDA_CLOUD;
  const status = error.problem && error.problem.status;

  switch (error.code) {
  case 'connection-failed':
    return saas
      ? ERROR_REASONS.CLUSTER_UNAVAILABLE
      : ERROR_REASONS.CONTACT_POINT_UNAVAILABLE;
  case 'unauthorized':
    return saas
      ? ERROR_REASONS.INVALID_CREDENTIALS
      : ERROR_REASONS.UNAUTHORIZED;
  case 'forbidden':
    return ERROR_REASONS.FORBIDDEN;
  case 'invalid-connection':
    return endpoint.authType === AUTH_TYPES.OAUTH
      ? ERROR_REASONS.OAUTH_URL
      : ERROR_REASONS.UNKNOWN;
  default:
    return status === 503
      ? ERROR_REASONS.CLUSTER_TEMPORARILY_UNAVAILABLE
      : ERROR_REASONS.UNKNOWN;
  }
}

/**
 * Map a c8ctl deploy result to the deployment response the renderer uses
 * (the gRPC-compatible shape `zeebe-api` produces).
 */
function toDeployResponse(result) {
  const { deploymentKey, tenantId } = result;

  return {
    key: deploymentKey,
    deploymentKey,
    tenantId,

    // Entries without a key are local files the cluster did not report.
    deployments: result.resources.filter(resource => resource.key).map(resource => {
      const { id, version, key, resourceName } = resource;

      if (resource.type === 'process') {
        return {
          processDefinition: {
            processDefinitionId: id,
            processDefinitionVersion: version,
            processDefinitionKey: key,
            resourceName,
            tenantId
          },
          process: {
            bpmnProcessId: id,
            version,
            processDefinitionKey: key,
            resourceName,
            tenantId
          }
        };
      }

      if (resource.type === 'decision') {
        return {
          decision: {
            decisionId: id,
            dmnDecisionId: id,
            version,
            decisionKey: key,
            decisionRequirementsKey: resource.decisionRequirementsKey,
            tenantId
          }
        };
      }

      if (resource.type === 'decision-requirements') {
        return {
          decisionRequirements: {
            decisionRequirementsId: id,
            dmnDecisionRequirementsId: id,
            version,
            decisionRequirementsKey: key,
            resourceName,
            tenantId
          }
        };
      }

      if (resource.type === 'form') {
        return {
          form: {
            formId: id,
            version,
            formKey: key,
            resourceName,
            tenantId
          }
        };
      }

      return {
        resource: {
          resourceId: id,
          version,
          resourceKey: key,
          resourceName,
          tenantId
        }
      };
    })
  };
}

/**
 * Map a c8ctl error to the serialized error the renderer shows. `code` is
 * c8ctl's stable error code.
 */
function toErrorResponse(error) {
  const { code, message, problem } = error;

  return {
    code,
    message,
    ...(problem && problem.detail ? { detail: problem.detail, details: problem.detail } : {})
  };
}
