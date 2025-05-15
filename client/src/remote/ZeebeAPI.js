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
      resourceConfigs,
      tenantId
    } = options;

    endpoint = getEndpointForTargetType(endpoint);

    return this._backend.send('zeebe:deploy', {
      endpoint,
      resourceConfigs,
      tenantId: getTenantId(tenantId, endpoint)
    });
  }

  startInstance(options) {
    let {
      endpoint,
      processId,
      tenantId,
      variables
    } = options;

    endpoint = getEndpointForTargetType(endpoint);

    return this._backend.send('zeebe:startInstance', {
      endpoint,
      processId,
      tenantId: getTenantId(tenantId, endpoint),
      variables
    });
  }

  getGatewayVersion(endpoint) {
    endpoint = getEndpointForTargetType(endpoint);

    return this._backend.send('zeebe:getGatewayVersion', {
      endpoint
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
    targetType
  } = endpoint;

  if (targetType === TARGET_TYPES.SELF_HOSTED && !isHttpOrHttps(contactPoint)) {
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
        url: contactPoint
      };

    case AUTH_TYPES.BASIC:
      return {
        type: TARGET_TYPES.SELF_HOSTED,
        authType: AUTH_TYPES.BASIC,
        url: contactPoint,
        basicAuthUsername,
        basicAuthPassword
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
        clientSecret
      };
    }
  }

  if (targetType === TARGET_TYPES.CAMUNDA_CLOUD) {
    return {
      type: TARGET_TYPES.CAMUNDA_CLOUD,
      url: camundaCloudClusterUrl,
      clientId: camundaCloudClientId,
      clientSecret: camundaCloudClientSecret
    };
  }

}

function getTenantId(tenantId, endpoint) {
  if (endpoint.authType !== AUTH_TYPES.OAUTH) {
    return undefined;
  }

  return tenantId;
}

/**
 * Check if the URL is HTTP or HTTPS.
 *
 * @example
 *
 * ```javascript
 * let isHttpOrHttps = isHttpOrHttps('http://foo.com');
 * console.log(isHttpOrHttps); // true
 *
 * isHttpOrHttps = isHttpOrHttps('https://foo.com');
 * console.log(isHttpOrHttps); // true
 *
 * isHttpOrHttps = isHttpOrHttps('ftp://foo.com');
 * console.log(isHttpOrHttps); // false
 * ```
 *
 * @param {string} url
 *
 * @returns {boolean}
 */
function isHttpOrHttps(url) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch (error) {
    return false;
  }
}