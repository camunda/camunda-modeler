/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import BaseInputValidator from './BaseInputValidator';
import { GenericApiErrors } from '../../shared/RestAPI';

export default class EndpointURLValidator extends BaseInputValidator {

  constructor(fieldName, validateNonEmpty, validatePattern, validateConnectionWithoutCredentials) {

    super(fieldName);

    this.validateNonEmpty = validateNonEmpty;
    this.validatePattern = validatePattern;
    this.validateConnectionWithoutCredentials = validateConnectionWithoutCredentials;

    this.isDirty = false;

    this.timeoutID = null;
  }

  resetCancel = () => {
    this.isCanceled = false;
  };

  cancel = () => {
    this.isCanceled = true;
    this.clearTimeout();
  };

  validateEndpointURLCompleteness(value) {
    const trimmed = value.trim();

    if (trimmed === 'http://' || trimmed === 'https://') {
      return 'Should point to a running Camunda REST API.';
    }

    return null;
  }

  setFieldError = (value, setFieldErrorMethod) => {
    this.setCachedValidationResult(value);
    setFieldErrorMethod('endpoint.url', value);
  };

  clearTimeout() {
    if (this.timeoutID !== null) {
      clearTimeout(this.timeoutID);
      this.timeoutID = null;
    }
  }

  setTimeout(value, setFieldError, onAuthDetection, onConnectionStatusUpdate) {
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

        if (isExpired || this.isCanceled) {
          return;
        }

        onConnectionStatusUpdate(code);
        onAuthDetection(code === GenericApiErrors.UNAUTHORIZED);

        if (code !== GenericApiErrors.UNAUTHORIZED) {
          return this.setFieldError(details, setFieldError);
        }
      } else {

        // auth not needed
        onAuthDetection(false);
        onConnectionStatusUpdate(null);
      }
    }, this.isDirty ? 1000 : 0);
  }

  validate(value = '', setFieldError, isOnBeforeSubmit, onAuthDetection, onConnectionStatusUpdate) {

    const {
      getCachedValue,
      setCachedValue,
      getCachedValidationResult,
      setCachedValidationResult
    } = this;

    if (getCachedValue() === value && !isOnBeforeSubmit) {
      return getCachedValidationResult();
    }

    setCachedValue(value);

    const nonEmptyValidation = this.validateNonEmpty(value, 'Endpoint URL must not be empty.');
    const patternValidation = this.validatePattern(value, /^https?:\/\//, 'Endpoint URL must start with "http://" or "https://".');
    const completenessValidation = this.validateEndpointURLCompleteness(value);

    this.clearTimeout();

    if (!isOnBeforeSubmit) {

      setCachedValidationResult(nonEmptyValidation || patternValidation || null);

      if (!getCachedValidationResult()) {
        this.setTimeout(value, setFieldError, onAuthDetection, onConnectionStatusUpdate);
      }
    } else {

      setCachedValidationResult(nonEmptyValidation || patternValidation || completenessValidation);
    }

    this.isDirty = true;
    return getCachedValidationResult();
  }
}
