/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import ConnectionChecker from './ConnectionChecker';

import {
  MUST_PROVIDE_A_VALUE,
  CONTACT_POINT_MUST_NOT_BE_EMPTY,
  BASIC_AUTH_USERNAME_MUST_NOT_BE_EMPTY,
  BASIC_AUTH_PASSWORD_MUST_NOT_BE_EMPTY,
  OAUTH_URL_MUST_NOT_BE_EMPTY,
  AUDIENCE_MUST_NOT_BE_EMPTY,
  CLIENT_ID_MUST_NOT_BE_EMPTY,
  CLIENT_SECRET_MUST_NOT_BE_EMPTY,
  CLUSTER_URL_MUST_BE_VALID_CLOUD_URL,
  CONTACT_POINT_MUST_BE_URL,
  CONTACT_POINT_MUST_START_WITH_PROTOCOL
} from './DeploymentPluginConstants';

import { AUTH_TYPES } from '../shared/ZeebeAuthTypes';

import { CAMUNDA_CLOUD, SELF_HOSTED } from '../shared/ZeebeTargetTypes';

export default class DeploymentPluginValidator {

  constructor(zeebeAPI) {
    this.zeebeAPI = zeebeAPI;
  }

  createConnectionChecker() {
    return new ConnectionChecker(this);
  }

  validateNonEmpty = (value, message = MUST_PROVIDE_A_VALUE) => {
    return value ? null : message;
  };

  validateZeebeContactPoint = (value) => {
    return this.validateNonEmpty(value, CONTACT_POINT_MUST_NOT_BE_EMPTY) ||
      validateUrl(value, CONTACT_POINT_MUST_BE_URL);
  };

  validateBasicAuthUsername = (value) => {
    return this.validateNonEmpty(value, BASIC_AUTH_USERNAME_MUST_NOT_BE_EMPTY);
  };

  validateBasicAuthPassword = (value) => {
    return this.validateNonEmpty(value, BASIC_AUTH_PASSWORD_MUST_NOT_BE_EMPTY);
  };

  validateOAuthURL = (value) => {
    return this.validateNonEmpty(value, OAUTH_URL_MUST_NOT_BE_EMPTY);
  };

  validateAudience = (value) => {
    return this.validateNonEmpty(value, AUDIENCE_MUST_NOT_BE_EMPTY);
  };

  validateScope = (value) => {
    return null;
  };

  validateClientId = (value) => {
    return this.validateNonEmpty(value, CLIENT_ID_MUST_NOT_BE_EMPTY);
  };

  validateClientSecret = (value) => {
    return this.validateNonEmpty(value, CLIENT_SECRET_MUST_NOT_BE_EMPTY);
  };

  validateClusterUrl = (value) => {
    return validCloudUrl(value) ? null : CLUSTER_URL_MUST_BE_VALID_CLOUD_URL;
  };

  validateConnection = (endpoint) => {
    return this.zeebeAPI.checkConnection(endpoint);
  };

  validateConfig = config => {
    const endpointErrors = this.validateEndpoint(config.endpoint);
    const deploymentErrors = this.validateDeployment(config.deployment);

    return { ...endpointErrors, ...deploymentErrors };
  };

  validateDeployment = deployment => {
    return this.validate(deployment, { name: this.validateNonEmpty });
  };

  validateEndpoint = endpoint => {
    const { authType, targetType } = endpoint;

    let validators = {};

    if (targetType === CAMUNDA_CLOUD) {
      validators = {
        camundaCloudClientId: this.validateClientId,
        camundaCloudClientSecret: this.validateClientSecret,
        camundaCloudClusterUrl: this.validateClusterUrl
      };
    } else if (targetType === SELF_HOSTED) {
      if (endpoint.authType === AUTH_TYPES.NONE) {
        validators = {
          contactPoint: this.validateZeebeContactPoint
        };
      } else if (authType === AUTH_TYPES.OAUTH) {
        validators = {
          contactPoint: this.validateZeebeContactPoint,
          oauthURL: this.validateOAuthURL,
          audience: this.validateAudience,
          clientId: this.validateClientId,
          clientSecret: this.validateClientSecret
        };
      }
    }

    return this.validate(endpoint, validators);
  };

  validate(values, validators) {

    const errors = {};

    for (const [ attr, validator ] of Object.entries(validators)) {

      if (!validator) {
        continue;
      }

      const error = validator(values[attr]);

      if (error) {
        errors[attr] = error;
      }
    }

    return errors;
  }
}

// helpers /////////////////

function validCloudUrl(url) {
  return /^(https:\/\/|)[a-z\d-]+\.[a-z]+-\d+\.zeebe\.camunda\.io(:443|)\/?/.test(url);
}

const validateUrl = (value, message) => {
  if (!/^https?:\/\//.test(value)) {
    return CONTACT_POINT_MUST_START_WITH_PROTOCOL;
  }

  try {
    new URL(value);
  } catch (e) {
    return message;
  }
};
