/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

export default class BaseInputValidator {

  constructor(fieldName) {
    this.fieldName = fieldName;

    this._cachedValidatonResult = null;
  }

  clearError = (setFieldError) => {
    this.setCachedValidationResult(null);
    setFieldError(this.fieldName, null);
  };

  updateError = (setFieldError, errorMessage) => {
    this.setCachedValidationResult(errorMessage);
    setFieldError(this.fieldName, errorMessage);
  };

  getCachedValue = () => {
    return this._cachedValue;
  };

  setCachedValue = (value) => {
    this._cachedValue = value;
  };

  onExternalError = (details, setFieldError) => {
    setFieldError(this.fieldName, details);

    this.setCachedValidationResult(details);
  };

  getCachedValidationResult = () => {
    return this._cachedValidatonResult;
  };

  setCachedValidationResult = (value) => {
    this._cachedValidatonResult = value;
  };

  invalidateCachedValidationResult = () => {
    this._cachedValidatonResult = null;
  };
}
