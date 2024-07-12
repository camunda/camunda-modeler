/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import AUTH_TYPES from '../../shared/AuthTypes';

import { default as CamundaAPI, ApiErrorMessages } from '../../shared/CamundaAPI';
import { GenericApiErrors } from '../../shared/RestAPI';

import EndpointURLValidator from './EndpointURLValidator';

import DefaultInputValidator from './DefaultInputValidator';

export default class DeploymentConfigValidator {

  constructor() {
    this.endpointURLValidator = new EndpointURLValidator(
      'endpoint.url',
      this.validateNonEmpty,
      this.validatePattern,
      this.validateConnectionWithoutCredentials
    );

    this.deploymentNameValidator = new DefaultInputValidator(
      'deployment.name',
      this.validateNonEmpty,
      'Deployment name must not be empty.'
    );

    this.usernameValidator = new DefaultInputValidator(
      'endpoint.username',
      this.validateNonEmpty,
      'Credentials are required to connect to the server.'
    );

    this.passwordValidator = new DefaultInputValidator(
      'endpoint.password',
      this.validateNonEmpty,
      'Credentials are required to connect to the server.'
    );

    this.tokenValidator = new DefaultInputValidator(
      'endpoint.token',
      this.validateNonEmpty,
      'Token must not be empty.'
    );

    this.lastConnectionCheckID = 0;
  }

  resetCancel = () => {
    this.endpointURLValidator.resetCancel();
  };

  cancel = () => {
    this.endpointURLValidator.cancel();
  };

  onExternalError = (authType, details, code, setFieldError) => {
    if (code === GenericApiErrors.UNAUTHORIZED) {
      if (authType === AUTH_TYPES.BASIC) {
        this.usernameValidator.onExternalError(details, setFieldError);
        this.passwordValidator.onExternalError(details, setFieldError);
      } else {
        this.tokenValidator.onExternalError(details, setFieldError);
      }
    } else {
      this.endpointURLValidator.onExternalError(details, setFieldError);
    }
  };

  validateEndpointURL = (value, setFieldError, isOnBeforeSubmit, onAuthDetection, onConnectionStatusUpdate) => {
    return this.endpointURLValidator.validate(
      value, setFieldError, isOnBeforeSubmit, onAuthDetection, onConnectionStatusUpdate
    );
  };

  validatePattern = (value, pattern, message) => {
    const matches = pattern.test(value);

    return matches ? null : message;
  };

  validateNonEmpty = (value, message = 'Must provide a value.') => {
    return value ? null : message;
  };

  validateDeploymentName = (value, isOnBeforeSubmit) => {
    return this.deploymentNameValidator.validate(value, isOnBeforeSubmit);
  };

  validateToken = (value, isOnBeforeSubmit) => {
    return this.tokenValidator.validate(value, isOnBeforeSubmit);
  };

  validatePassword = (value, isOnBeforeSubmit) => {
    return this.passwordValidator.validate(value, isOnBeforeSubmit);
  };

  validateUsername = (value, isOnBeforeSubmit) => {
    return this.usernameValidator.validate(value, isOnBeforeSubmit);
  };

  validateDeployment(deployment = {}) {
    return this.validate(deployment, {
      name: this.validateDeploymentName,
      attachments: this.validateAttachments
    });
  }

  validateEndpoint(endpoint = {}) {

    return this.validate(endpoint, {
      url: this.validateEndpointURL,
      token: endpoint.authType === AUTH_TYPES.BEARER && this.validateToken,
      password: endpoint.authType === AUTH_TYPES.BASIC && this.validatePassword,
      username: endpoint.authType === AUTH_TYPES.BASIC && this.validateUsername
    });
  }

  validateAttachments(attachments = []) {
    const errors = attachments.map(({ contents }) => {
      if (contents === null) {
        return 'File not found.';
      }
    });

    return errors.some(error => !!error) ? errors : undefined;
  }

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

  validateConnection = async endpoint => {

    const api = new CamundaAPI(endpoint);

    try {
      await api.checkConnection();
    } catch (error) {
      return error;
    }

    return null;
  };

  validateConnectionWithoutCredentials = async (url) => {
    this.lastConnectionCheckID ++;
    const lastConnectionCheckID = this.lastConnectionCheckID;
    const result = await this.validateConnection({ url });

    if (this.lastConnectionCheckID != lastConnectionCheckID) {

      // URL has changed while we were waiting for the response of an older request
      return { isExpired: true };
    }
    return result;
  };

  clearEndpointURLError = (setFieldError) => {
    this.endpointURLValidator.clearError(setFieldError);
  };

  updateEndpointURLError = (code, setFieldError) => {

    const errorMessage = ApiErrorMessages[code];
    this.endpointURLValidator.updateError(setFieldError, errorMessage);
  };

  validateBasic(configuration) {

    const {
      deployment,
      endpoint
    } = configuration;

    const deploymentErrors = this.validateDeployment(deployment);
    const endpointErrors = this.validateEndpoint(endpoint);

    return filterErrors({
      deployment: deploymentErrors,
      endpoint: endpointErrors
    });
  }

  /**
   * Check if configuration is valid.
   *
   * @param {*} configuration
   * @returns {boolean}
   */
  isConfigurationValid(configuration) {
    if (!configuration) {
      return false;
    }

    const errors = this.validateBasic(configuration);

    return !hasKeys(errors);
  }
}


// helpers /////////////////

function hasKeys(obj) {
  return obj && Object.keys(obj).length > 0;
}

function filterErrors(errors) {

  return Object.entries(errors).reduce((filtered, [ key, value ]) => {

    if (value && hasKeys(value)) {
      filtered[key] = value;
    }

    return filtered;
  }, {});
}
