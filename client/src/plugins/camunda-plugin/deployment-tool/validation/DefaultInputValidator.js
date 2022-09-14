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

export default class DefaultInputValidator extends BaseInputValidator {

  // This validator validates input fields:
  //    Not initially
  //    Only when the form is submitted
  //
  // This validator is also "forgiving", it means that
  // once the user types anything on a non-validated field
  // the error dissapears and won't be shown until the form
  // is submitted again.

  constructor(fieldName, validateNonEmpty, text) {

    super(fieldName);

    this.validateNonEmpty = validateNonEmpty;
    this.text = text;
  }

  _validate = (value, forceRecheck) => {
    const {
      text,
      validateNonEmpty,
      getCachedValidationResult,
      setCachedValidationResult
    } = this;

    if (forceRecheck) {
      const result = validateNonEmpty(value, text);
      setCachedValidationResult(result);
      return result;
    }
    return getCachedValidationResult();
  };

  validate = (value, isOnBeforeSubmit) => {

    const {
      getCachedValue,
      setCachedValue,
      invalidateCachedValidationResult,
      _validate
    } = this;

    // always force validation before submit
    if (isOnBeforeSubmit) {
      setCachedValue(value);
      return _validate(value, true);
    }

    // user is typing on the field
    if (value !== getCachedValue()) {
      setCachedValue(value);
      invalidateCachedValidationResult();
      return null;
    }

    // user is not typing on the field.
    if (value === getCachedValue()) {
      return _validate(value, false);
    }

    setCachedValue(value);
  };
}
