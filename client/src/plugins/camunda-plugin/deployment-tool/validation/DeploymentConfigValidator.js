/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import AuthTypes from '../../shared/AuthTypes';

import CamundaAPI from '../../shared/CamundaAPI';

import EndpointURLValidator from './EndpointURLValidator';

export default class DeploymentConfigValidator {

  constructor() {
    this.endpointURLValidator = new EndpointURLValidator(
      this.validateNonEmpty,
      this.validatePattern,
      this.validateConnectionWithoutCredentials
    );

    this.lastConnectionCheckID = 0;
  }

  validateEndpointURL = (value, setFieldError, isOnBeforeSubmit, onAuthDetection) => {
    return this.endpointURLValidator.validate(value, setFieldError, isOnBeforeSubmit, onAuthDetection);
  }

  validatePattern = (value, pattern, message) => {
    const matches = pattern.test(value);

    return matches ? null : message;
  }

  validateNonEmpty = (value, message = 'Must provide a value.') => {
    return value ? null : message;
  }

  validateDeploymentName = (value) => {
    return this.validateNonEmpty(value, 'Deployment name must not be empty.');
  }

  validateToken = (value) => {
    return this.validateNonEmpty(value, 'Token must not be empty.');
  }

  validatePassword = (value) => {
    return this.validateNonEmpty(value, 'Password must not be empty.');
  }

  validateUsername = (value) => {
    return this.validateNonEmpty(value, 'Username must not be empty.');
  }

  validateDeployment(deployment = {}) {
    return this.validate(deployment, {
      name: this.validateDeploymentName
    });
  }

  validateEndpoint(endpoint = {}) {

    return this.validate(endpoint, {
      url: this.validateEndpointURL,
      token: endpoint.authType === AuthTypes.bearer && this.validateToken,
      password: endpoint.authType === AuthTypes.basic && this.validatePassword,
      username: endpoint.authType === AuthTypes.basic && this.validateUsername
    });
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
  }

  validateConnectionWithoutCredentials = async (url) => {
    this.lastConnectionCheckID ++;
    const lastConnectionCheckID = this.lastConnectionCheckID;
    const result = await this.validateConnection({ url });

    if (this.lastConnectionCheckID != lastConnectionCheckID) {

      // URL has changed while we were waiting for the response of an older request
      return { isExpired: true };
    }
    return result;
  }

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

  isConfigurationValid(configuration) {

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
