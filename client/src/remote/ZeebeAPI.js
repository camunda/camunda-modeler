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
 * @typedef {import('../plugins/zeebe-plugin/deployment-plugin/types').Endpoint} Endpoint
 */

export const AUTH_TYPES = {
  NONE: 'none',
  BASIC: 'basic',
  OAUTH: 'oauth'
};

export const TARGET_TYPES = {
  CAMUNDA_CLOUD: 'camundaCloud',
  SELF_HOSTED: 'selfHosted'
};

/**
 * Frontend API for Zeebe.
 */
export default class ZeebeAPI {
  constructor(backend) {
    this._backend = backend;
  }

  checkConnection(endpoint) {
    endpoint = getEndpointForTargetType(endpoint);

    return this._backend.send('zeebe:checkConnection', {
      endpoint
    });
  }

  deploy(options) {
    let {
      endpoint,
      resourceConfigs
    } = options;

    endpoint = getEndpointForTargetType(endpoint);

    return this._backend.send('zeebe:deploy', {
      endpoint,
      resourceConfigs
    });
  }

  startInstance(options) {
    let {
      endpoint,
      processDefinitionKey,
      processId,
      variables,
      startInstructions,
      runtimeInstructions
    } = options;

    endpoint = getEndpointForTargetType(endpoint);

    return this._backend.send('zeebe:startInstance', {
      endpoint,
      processDefinitionKey,
      processId,
      variables,
      startInstructions,
      runtimeInstructions
    });
  }

  getGatewayVersion(endpoint) {
    endpoint = getEndpointForTargetType(endpoint);

    return this._backend.send('zeebe:getGatewayVersion', {
      endpoint
    });
  }

  searchProcessInstances(options, processInstanceKey) {
    let { endpoint } = options;

    endpoint = getEndpointForTargetType(endpoint);

    return this._backend.send('zeebe:searchProcessInstances', {
      endpoint,
      processInstanceKey
    });
  }

  searchElementInstances(options, processInstanceKey) {
    let { endpoint } = options;

    endpoint = getEndpointForTargetType(endpoint);

    return this._backend.send('zeebe:searchElementInstances', {
      endpoint,
      processInstanceKey
    });
  }

  searchVariables(options, processInstanceKey) {
    let { endpoint } = options;

    endpoint = getEndpointForTargetType(endpoint);

    return this._backend.send('zeebe:searchVariables', {
      endpoint,
      processInstanceKey
    });
  }

  searchIncidents(options, processInstanceKey) {
    let { endpoint } = options;

    endpoint = getEndpointForTargetType(endpoint);

    return this._backend.send('zeebe:searchIncidents', {
      endpoint,
      processInstanceKey
    });
  }
}

/**
 * Get endpoint for target type.
 *
 * @param {Endpoint} endpoint
 */
export function getEndpointForTargetType(endpoint) {
  let {
    audience,
    authType,
    basicAuthPassword,
    basicAuthUsername,
    camundaCloudClientId,
    camundaCloudClientSecret,
    camundaCloudClusterUrl,
    clientId,
    clientSecret,
    contactPoint,
    oauthURL,
    scope,
    targetType,
    tenantId
  } = endpoint;

  if (targetType === TARGET_TYPES.SELF_HOSTED && !isValidProtocol(contactPoint)) {
    contactPoint = `http://${ contactPoint }`;
  }

  if (!scope || !scope.length) {
    scope = undefined;
  }

  if (targetType === TARGET_TYPES.SELF_HOSTED) {
    switch (authType) {

    case AUTH_TYPES.NONE:
      return {
        type: TARGET_TYPES.SELF_HOSTED,
        authType: AUTH_TYPES.NONE,
        url: contactPoint,
        tenantId
      };

    case AUTH_TYPES.BASIC:
      return {
        type: TARGET_TYPES.SELF_HOSTED,
        authType: AUTH_TYPES.BASIC,
        url: contactPoint,
        basicAuthUsername,
        basicAuthPassword,
        tenantId
      };

    case AUTH_TYPES.OAUTH:
      return {
        type: TARGET_TYPES.SELF_HOSTED,
        authType: AUTH_TYPES.OAUTH,
        url: contactPoint,
        oauthURL,
        audience,
        scope,
        clientId,
        clientSecret,
        tenantId
      };
    }
  }

  if (targetType === TARGET_TYPES.CAMUNDA_CLOUD) {
    return {
      type: TARGET_TYPES.CAMUNDA_CLOUD,
      url: camundaCloudClusterUrl,
      clientId: camundaCloudClientId,
      clientSecret: camundaCloudClientSecret,
    };
  }

}

/**
 * Check if the URL is HTTP(S) or GRPC(S).
 *
 * @example
 *
 * ```javascript
 * let isValidProtocol = isValidProtocol('http://foo.com');
 * console.log(isValidProtocol); // true
 *
 * isValidProtocol = isValidProtocol('https://foo.com');
 * console.log(isValidProtocol); // true
 *
 * isValidProtocol = isValidProtocol('ftp://foo.com');
 * console.log(isValidProtocol); // false
 * ```
 *
 * @param {string} url
 *
 * @returns {boolean}
 */
function isValidProtocol(url) {
  try {
    const parsedUrl = new URL(url);
    return [ 'http:', 'https:', 'grpc:', 'grpcs:' ].includes(parsedUrl.protocol);
  } catch (error) {
    return false;
  }
}
