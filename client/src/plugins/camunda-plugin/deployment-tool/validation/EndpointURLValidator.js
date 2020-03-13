/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

export default class EndpointURLValidator {

  constructor(validateNonEmpty, validatePattern, validateConnectionWithoutCredentials) {
    this.validateNonEmpty = validateNonEmpty;
    this.validatePattern = validatePattern;
    this.validateConnectionWithoutCredentials = validateConnectionWithoutCredentials;
    this.isDirty = false;
  }

  validateEndpointURLCompleteness(value) {
    const trimmed = value.trim();

    if (trimmed === 'http://' || trimmed === 'https://') {
      return 'Should point to a running Camunda Engine REST API.';
    }

    return null;
  }

  setFieldError = (value, setFieldErrorMethod) => {
    this.cachedReturnValue = value;
    setFieldErrorMethod('endpoint.url', value);
  }

  clearTimeout() {
    if (this.timeoutID) {
      clearTimeout(this.timeoutID);
      this.timeoutID = null;
    }
  }

  setTimeout(value, setFieldError, onAuthDetection) {
    this.timeoutID = setTimeout(async () => {
      const completenessValidation = this.validateEndpointURLCompleteness(value);

      if (completenessValidation) {
        return this.setFieldError(completenessValidation, setFieldError);
      }

      const connectionValidation = await this.validateConnectionWithoutCredentials(value);

      if (connectionValidation) {
        const {
          code,
          details,
          isExpired
        } = connectionValidation;

        if (isExpired) {
          return;
        }

        onAuthDetection(code === 'UNAUTHORIZED');

        if (code !== 'UNAUTHORIZED') {
          return this.setFieldError(details, setFieldError);
        }
      } else {

        // auth not needed
        onAuthDetection(false);
      }
    }, this.isDirty ? 1000 : 0);
  }

  validate(value = '', setFieldError, isOnBeforeSubmit, onAuthDetection) {

    if (this.cachedValue === value && !isOnBeforeSubmit) {
      return this.cachedReturnValue;
    }

    this.cachedValue = value;

    const nonEmptyValidation = this.validateNonEmpty(value, 'Endpoint URL must not be empty.');
    const patternValidation = this.validatePattern(value, /^https?:\/\//, 'Endpoint URL must start with "http://" or "https://".');
    const completenessValidation = this.validateEndpointURLCompleteness(value);

    this.clearTimeout();

    if (!isOnBeforeSubmit) {

      this.cachedReturnValue = nonEmptyValidation || patternValidation || null;

      if (!this.cachedReturnValue) {
        this.setTimeout(value, setFieldError, onAuthDetection);
      }
    } else {

      this.cachedReturnValue = nonEmptyValidation || patternValidation || completenessValidation;
    }

    this.isDirty = true;
    return this.cachedReturnValue;
  }
}
