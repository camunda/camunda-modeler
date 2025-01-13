/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

export const AUTH_TYPES = {
  NONE: 'none',
  BASIC: 'basic',
  OAUTH: 'oauth'
};

export const ENDPOINT_TYPES = {
  SELF_HOSTED: 'selfHosted',
  CAMUNDA_CLOUD: 'camundaCloud'
};

/**
 * ZeebeAPI for deployment/run instance.
 */
export default class ZeebeAPI {

  constructor(backend) {
    this.backend = backend;
  }

  checkConnection(endpoint) {
    const configuration = getEndpointConfiguration(endpoint);

    return this.backend.send('zeebe:checkConnection', { endpoint: configuration });
  }

  deploy(options) {
    const {
      endpoint
    } = options;

    const configuration = getEndpointConfiguration(endpoint);

    return this.backend.send('zeebe:deploy', {
      ...options,
      endpoint: configuration
    });
  }

  run(options) {
    const {
      endpoint
    } = options;

    const configuration = getEndpointConfiguration(endpoint);

    return this.backend.send('zeebe:run', {
      ...options,
      endpoint: configuration
    });
  }

  getGatewayVersion(endpoint) {
    const configuration = getEndpointConfiguration(endpoint);

    return this.backend.send('zeebe:getGatewayVersion', { endpoint: configuration });
  }

}


// helpers //////////////////

function getEndpointConfiguration(endpoint) {

  const {
    authType,
    audience,
    scope,
    targetType,
    clientId,
    clientSecret,
    basicAuthUsername,
    basicAuthPassword,
    oauthURL,
    contactPoint,
    camundaCloudClientId,
    camundaCloudClientSecret,
    camundaCloudClusterUrl
  } = endpoint;

  if (targetType === ENDPOINT_TYPES.SELF_HOSTED) {
    switch (authType) {

    case AUTH_TYPES.NONE:
      return {
        type: ENDPOINT_TYPES.SELF_HOSTED,
        authType: AUTH_TYPES.NONE,
        url: contactPoint
      };

    case AUTH_TYPES.BASIC:
      return {
        type: ENDPOINT_TYPES.SELF_HOSTED,
        authType: AUTH_TYPES.BASIC,
        url: contactPoint,
        basicAuthUsername,
        basicAuthPassword
      };

    case AUTH_TYPES.OAUTH:
      return {
        type: ENDPOINT_TYPES.SELF_HOSTED,
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

  if (targetType === ENDPOINT_TYPES.CAMUNDA_CLOUD) {
    return {
      type: ENDPOINT_TYPES.CAMUNDA_CLOUD,
      clientId: camundaCloudClientId,
      clientSecret: camundaCloudClientSecret,
      url: camundaCloudClusterUrl,
    };
  }

}
