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
 * @typedef {import('../types.d.ts').DeploymentConfig} DeploymentConfig
 */

import { AUTH_TYPES, TARGET_TYPES } from '../../../remote/ZeebeAPI';

export const VALIDATION_ERROR_MESSAGES = {
  AUDIENCE_MUST_NOT_BE_EMPTY: 'Audience must not be empty.',
  BASIC_AUTH_PASSWORD_MUST_NOT_BE_EMPTY: 'Password must not be empty.',
  BASIC_AUTH_USERNAME_MUST_NOT_BE_EMPTY: 'Username must not be empty.',
  CLIENT_ID_MUST_NOT_BE_EMPTY: 'Client ID must not be empty.',
  CLIENT_SECRET_MUST_NOT_BE_EMPTY: 'Client Secret must not be empty.',
  CLUSTER_URL_MUST_BE_VALID_CLOUD_URL: 'Must be a valid Camunda 8 SaaS URL.',
  CONTACT_POINT_MUST_BE_URL: 'Cluster endpoint must be a valid URL.',
  CONTACT_POINT_MUST_NOT_BE_EMPTY: 'Cluster endpoint must not be empty.',
  CLUSTER_URL_MUST_NOT_BE_EMPTY: 'Cluster URL must not be empty.',
  CONTACT_POINT_MUST_START_WITH_PROTOCOL: 'Cluster endpoint must start with "http://", "grpc://", "https://", or "grpcs://".',
  MUST_PROVIDE_A_VALUE: 'Must provide a value.',
  OAUTH_URL_MUST_NOT_BE_EMPTY: 'OAuth URL must not be empty.'
};

export default class DeploymentConfigValidator {

  /**
   * Validate config value.
   *
   * @param {string} name
   * @param {string} value
   *
   * @returns {string|null}
   */
  static validateConfigValue(name, value) {
    if (name === 'endpoint.audience') {
      return validateNonEmpty(value, VALIDATION_ERROR_MESSAGES.AUDIENCE_MUST_NOT_BE_EMPTY);
    } else if (name === 'endpoint.basicAuthPassword') {
      return validateNonEmpty(value, VALIDATION_ERROR_MESSAGES.BASIC_AUTH_PASSWORD_MUST_NOT_BE_EMPTY);
    } else if (name === 'endpoint.basicAuthUsername') {
      return validateNonEmpty(value, VALIDATION_ERROR_MESSAGES.BASIC_AUTH_USERNAME_MUST_NOT_BE_EMPTY);
    } else if (name === 'endpoint.camundaCloudClusterUrl') {
      return validateNonEmpty(value, VALIDATION_ERROR_MESSAGES.CLUSTER_URL_MUST_NOT_BE_EMPTY) || validateClusterUrl(value, VALIDATION_ERROR_MESSAGES.CLUSTER_URL_MUST_BE_VALID_CLOUD_URL);
    } else if (name === 'endpoint.contactPoint') {
      return validateNonEmpty(value, VALIDATION_ERROR_MESSAGES.CONTACT_POINT_MUST_NOT_BE_EMPTY) || validateUrl(value, VALIDATION_ERROR_MESSAGES.CONTACT_POINT_MUST_BE_URL);
    } else if (name === 'endpoint.oauthURL') {
      return validateNonEmpty(value, VALIDATION_ERROR_MESSAGES.OAUTH_URL_MUST_NOT_BE_EMPTY);
    } else if ([
      'endpoint.camundaCloudClientId',
      'endpoint.clientId'
    ].includes(name)) {
      return validateNonEmpty(value, VALIDATION_ERROR_MESSAGES.CLIENT_ID_MUST_NOT_BE_EMPTY);
    } else if ([
      'endpoint.camundaCloudClientSecret',
      'endpoint.clientSecret'
    ].includes(name)) {
      return validateNonEmpty(value, VALIDATION_ERROR_MESSAGES.CLIENT_SECRET_MUST_NOT_BE_EMPTY);
    }

    return null;
  }

  /**
   * Validate config.
   *
   * @param {DeploymentConfig} config
   *
   * @returns { { [key:string]: string } }
   */
  static validateConfig(config) {
    const { endpoint } = config;

    const {
      authType,
      targetType
    } = endpoint;

    let validationErrors = {};

    if (targetType === TARGET_TYPES.CAMUNDA_CLOUD) {
      const camundaCloudClientIdValidationError = DeploymentConfigValidator.validateConfigValue('endpoint.camundaCloudClientId', endpoint.camundaCloudClientId);

      if (camundaCloudClientIdValidationError) {
        validationErrors['endpoint.camundaCloudClientId'] = camundaCloudClientIdValidationError;
      }

      const camundaCloudClientSecretValidationError = DeploymentConfigValidator.validateConfigValue('endpoint.camundaCloudClientSecret', endpoint.camundaCloudClientSecret);

      if (camundaCloudClientSecretValidationError) {
        validationErrors['endpoint.camundaCloudClientSecret'] = camundaCloudClientSecretValidationError;
      }

      const camundaCloudClusterUrlValidationError = DeploymentConfigValidator.validateConfigValue('endpoint.camundaCloudClusterUrl', endpoint.camundaCloudClusterUrl);

      if (camundaCloudClusterUrlValidationError) {
        validationErrors['endpoint.camundaCloudClusterUrl'] = camundaCloudClusterUrlValidationError;
      }
    } else if (targetType === TARGET_TYPES.SELF_HOSTED) {
      const contactPointValidationError = DeploymentConfigValidator.validateConfigValue('endpoint.contactPoint', endpoint.contactPoint);

      if (contactPointValidationError) {
        validationErrors['endpoint.contactPoint'] = contactPointValidationError;
      }

      if (endpoint.authType === AUTH_TYPES.BASIC) {
        const basicAuthUsernameValidationError = DeploymentConfigValidator.validateConfigValue('endpoint.basicAuthUsername', endpoint.basicAuthUsername);

        if (basicAuthUsernameValidationError) {
          validationErrors['endpoint.basicAuthUsername'] = basicAuthUsernameValidationError;
        }

        const basicAuthPasswordValidationError = DeploymentConfigValidator.validateConfigValue('endpoint.basicAuthPassword', endpoint.basicAuthPassword);

        if (basicAuthPasswordValidationError) {
          validationErrors['endpoint.basicAuthPassword'] = basicAuthPasswordValidationError;
        }
      } else if (authType === AUTH_TYPES.OAUTH) {
        const audienceValidationError = DeploymentConfigValidator.validateConfigValue('endpoint.audience', endpoint.audience);

        if (audienceValidationError) {
          validationErrors['endpoint.audience'] = audienceValidationError;
        }

        const clientIdValidationError = DeploymentConfigValidator.validateConfigValue('endpoint.clientId', endpoint.clientId);

        if (clientIdValidationError) {
          validationErrors['endpoint.clientId'] = clientIdValidationError;
        }

        const clientSecretValidationError = DeploymentConfigValidator.validateConfigValue('endpoint.clientSecret', endpoint.clientSecret);

        if (clientSecretValidationError) {
          validationErrors['endpoint.clientSecret'] = clientSecretValidationError;
        }

        const oauthURLValidationError = DeploymentConfigValidator.validateConfigValue('endpoint.oauthURL', endpoint.oauthURL);

        if (oauthURLValidationError) {
          validationErrors['endpoint.oauthURL'] = oauthURLValidationError;
        }
      }
    }

    return validationErrors;
  }
}

const GRPC_CLUSTER_URL_REGEX = /^((https|grpcs):\/\/|)[a-z\d-]+\.[a-z]+-\d+\.zeebe\.camunda\.io(:443|)\/?/;

const REST_CLUSTER_URL_REGEX = /^https:\/\/[a-z]+-\d+\.zeebe\.camunda\.io(:443|)\/[a-z\d-]+\/?/;

/**
 * Validate cluster URL. Valid Camunda 8 SaaS URL must start with "https://" or "grpcs://" and end with ".zeebe.camunda.io".
 *
 * @example
 *
 * ```javascript
 * validateClusterUrl('https://region-1.zeebe.camunda.io/cluster-name', validationErrorMessage); // null
 * validateClusterUrl('http://region-1.zeebe.camunda.io/cluster-name', validationErrorMessage); // validationErrorMessage
 * validateClusterUrl('https://cluster-name.region-1.zeebe.camunda.io:443', validationErrorMessage); // null
 * validateClusterUrl('http://cluster-name.region-1.zeebe.camunda.io:443', validationErrorMessage); // validationErrorMessage
 * validateClusterUrl('grpcs://cluster-name.region-1.zeebe.camunda.io:443', validationErrorMessage); // null
 * validateClusterUrl('grpc://cluster-name.region-1.zeebe.camunda.io:443', validationErrorMessage); // validationErrorMessage
 * validateClusterUrl('ftp://cluster-name.region-1.zeebe.camunda.io:443', validationErrorMessage); // validationErrorMessage
 * ```
 *
 * @param {string} url Url to validate
 * @param {string} validationErrorMessage returned if URL is invalid
 *
 * @returns {string|null}
 */
function validateClusterUrl(url, validationErrorMessage) {
  if (!GRPC_CLUSTER_URL_REGEX.test(url) && !REST_CLUSTER_URL_REGEX.test(url)) {
    return validationErrorMessage;
  }

  return null;
}

/**
 * Validate URL. Valid URL must start with "http://" or "https://" and be a valid URL.
 *
 * @example
 *
 * ```javascript
 * validateUrl('http://localhost:26500'); // null
 * validateUrl('https://localhost:26500'); // null
 * validateUrl('grpc://localhost:26500'); // null
 * validateUrl('grpcs://localhost:26500'); // null
 * validateUrl('https://camunda.io'); // null
 * validateUrl('https://zeebe.camunda.io'); // null
 * validateUrl('grpcs://zeebe.camunda.io'); // null
 * validateUrl('ftp://camunda.io'); // CONTACT_POINT_MUST_START_WITH_PROTOCOL
 * validateUrl('www.camunda.io'); // CONTACT_POINT_MUST_START_WITH_PROTOCOL
 * validateUrl('localhost:26500'); // CONTACT_POINT_MUST_START_WITH_PROTOCOL
 * ```
 *
 * @param {string} value
 * @param {string} validationErrorMessage
 *
 * @returns {string|null}
 */
function validateUrl(value, validationErrorMessage) {
  if (!/^(http|grpc)s?:\/\//.test(value)) {
    return VALIDATION_ERROR_MESSAGES.CONTACT_POINT_MUST_START_WITH_PROTOCOL;
  }

  try {
    new URL(value);
  } catch (e) {
    return validationErrorMessage;
  }

  return null;
}

function validateNonEmpty(value, validationErrorMessage = VALIDATION_ERROR_MESSAGES.MUST_PROVIDE_A_VALUE) {
  if (!value || !value.trim()) {
    return validationErrorMessage;
  }

  return null;
}