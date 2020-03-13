/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

export default class DefaultInputValidator {

  // This validator validates input fields:
  //    Not initially
  //    Only when the form is submitted
  //
  // This validator is also "forgiving", it means that
  // once the user types anything on a non-validated field
  // the error dissapears and won't be shown until the form
  // is submitted again.

  constructor(validateNonEmpty, text) {
    this.validateNonEmpty = validateNonEmpty;
    this.text = text;
  }

  _validate(value, forceRecheck) {
    const { text, validateNonEmpty, cachedValidationResult } = this;

    if (forceRecheck) {
      const result = validateNonEmpty(value, text);
      this.cachedValidationResult = result;
      return result;
    }
    return cachedValidationResult;
  }

  validate(value, isOnBeforeSubmit) {

    // always force validation before submit
    if (isOnBeforeSubmit) {
      this.cachedValue = value;
      return this._validate(value, true);
    }

    // user is typing on the field
    if (value !== this.cachedValue) {
      this.cachedValue = value;
      this.cachedValidationResult = null;
      return null;
    }

    // user is not typing on the field.
    if (value === this.cachedValue) {
      return this._validate(value, false);
    }

    this.cachedValue = value;
  }
}
