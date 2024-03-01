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
  OAUTH: 'oauth',
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
    oauthURL,
    contactPoint,
    camundaCloudClientId,
    camundaCloudClientSecret,
    camundaCloudClusterId,
    camundaCloudClusterRegion
  } = endpoint;

  if (targetType === ENDPOINT_TYPES.SELF_HOSTED) {
    switch (authType) {

    case AUTH_TYPES.NONE:
      return {
        type: ENDPOINT_TYPES.SELF_HOSTED,
        url: contactPoint
      };

    case AUTH_TYPES.OAUTH:
      return {
        type: AUTH_TYPES.OAUTH,
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
      clusterId: camundaCloudClusterId,
      ...(camundaCloudClusterRegion ? { clusterRegion: camundaCloudClusterRegion } : {})
    };
  }

}
