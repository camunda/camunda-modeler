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

const DELAYS = {
  SHORT: 1000,
  LONG: 5000
};

export default class ConnectionChecker {

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

    this.endpoint = null;

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
      endpointErrors
    } = result;

    this.lastCheck = {
      endpoint,
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

    hooks && hooks.onStart && hooks.onStart();
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

    validator.validateConnection(endpoint).then(connectionResult => {

      this.checkCompleted(endpoint, {
        connectionResult
      });

    }).catch(error => {
      console.error('connection check failed', error);
    });
  }

  getCheckDelay(endpoint, lastCheck) {

    if (!lastCheck) {
      return DELAYS.SHORT;
    }

    const {
      endpoint: lastEndpoint
    } = lastCheck;

    const endpointChanged = !shallowEquals(endpoint, lastEndpoint);

    if (endpointChanged) {
      return DELAYS.SHORT;
    }

    return DELAYS.LONG;
  }
}

// helpers /////////////////

function hasKeys(obj) {
  return obj && Object.keys(obj).length > 0;
}

function shallowEquals(a, b) {
  return hash(a) === hash(b);
}

function hash(el) {
  return JSON.stringify(el);
}