/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import pDefer from 'p-defer';

import AuthTypes from '../shared/AuthTypes';

import CamundaAPI from '../shared/CamundaAPI';


export default class DeploymentConfigValidator {

  validateEndpointURL = (value) => {
    return (
      this.validateNonEmpty(value, 'Endpoint URL must not be empty.') ||
      this.validatePattern(value, /^https?:\/\//, 'Endpoint URL must start with "http://" or "https://".') ||
      null
    );
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

  createConnectionChecker() {
    return new ConnectionChecker(this);
  }

}


class ConnectionChecker {

  constructor(validator) {
    this.validator = validator;
  }

  subscribe(hooks) {
    this.hooks = hooks;
  }

  unsubscribe() {

    if (this.checkTimer) {
      clearTimeout(this.checkTimer);

      this.checkTimer = null;
    }

    this.endpoint = { __non_existing_endpoint: true };

    this.lastCheck = null;

    this.hooks = null;
  }

  check(endpoint) {
    this.setEndpoint(endpoint);

    const {
      lastCheck
    } = this;

    // return cached result if endpoint did not change
    // we'll periodically re-check in background anyway
    if (lastCheck && shallowEquals(endpoint, lastCheck.endpoint)) {
      return Promise.resolve(lastCheck.result);
    }

    const deferred = this.scheduleCheck();

    return deferred.promise;
  }

  setEndpoint(endpoint) {
    this.endpoint = endpoint;
  }

  checkCompleted(endpoint, result) {

    const {
      endpoint: currentEndpoint,
      deferred,
      hooks
    } = this;

    if (!shallowEquals(endpoint, currentEndpoint)) {
      return;
    }

    const {
      connectionError,
      endpointErrors
    } = result;

    this.lastCheck = {
      endpoint,
      unauthorized: connectionError && connectionError.code === 'UNAUTHORIZED',
      result
    };

    this.deferred = null;

    deferred.resolve(result);

    hooks && hooks.onComplete && hooks.onComplete(result);

    if (!hasKeys(endpointErrors)) {
      this.scheduleCheck();
    }
  }

  checkStart() {

    const {
      hooks
    } = this;

    hooks.onStart && hooks.onStart();
  }

  scheduleCheck() {

    const {
      endpoint,
      lastCheck,
      checkTimer,
      validator
    } = this;

    const deferred = this.deferred = this.deferred || pDefer();

    // stop scheduled check
    if (checkTimer) {
      clearTimeout(checkTimer);
    }

    const endpointErrors = validator.validateEndpoint(endpoint);

    if (hasKeys(endpointErrors)) {
      this.checkCompleted(endpoint, {
        endpointErrors
      });
    } else {

      const delay = this.getCheckDelay(endpoint, lastCheck);

      this.checkTimer = setTimeout(() => {
        this.triggerCheck();
      }, delay);
    }

    return deferred;
  }

  triggerCheck() {
    const {
      endpoint,
      validator
    } = this;

    this.checkStart();

    validator.validateConnection(endpoint).then(connectionError => {

      this.checkCompleted(endpoint, {
        connectionError
      });

    }).catch(error => {
      console.error('connection check failed', error);
    });
  }

  getCheckDelay(endpoint, lastCheck) {

    if (!lastCheck) {
      return 1000;
    }

    const {
      endpoint: lastEndpoint,
      unauthorized
    } = lastCheck;

    const endpointChanged = !shallowEquals(endpoint, lastEndpoint);

    if (endpointChanged) {
      return 1000;
    }

    // back-off if last check was unauthorized.
    // we do not want the user to be blocked by the engine
    return unauthorized ? 15000 : 5000;
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


function hash(el) {
  return JSON.stringify(el);
}

function shallowEquals(a, b) {
  return hash(a) === hash(b);
}
