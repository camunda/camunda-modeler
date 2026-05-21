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
 * @typedef {import('../deployment-plugin/types.d.ts').DeploymentConfig} DeploymentConfig
 */

export const BUSINESS_ID_MAX_LENGTH = 256;

export const VALIDATION_ERROR_MESSAGES = {
  VARIABLES_MUST_BE_VALID_JSON: 'Variables must be valid JSON.',
  BUSINESS_ID_TOO_LONG: `Business ID must not exceed ${BUSINESS_ID_MAX_LENGTH} characters.`,
};

export default class StartInstanceConfigValidator {

  /**
   * Validate config value.
   *
   * @param {string} name
   * @param {string} value
   *
   * @returns {string|null}
   */
  static validateConfigValue(name, value) {
    if (name === 'variables') {
      return value.trim().length && validateJSON(value, VALIDATION_ERROR_MESSAGES.VARIABLES_MUST_BE_VALID_JSON);
    }

    if (name === 'businessId') {
      if (value && value.length > BUSINESS_ID_MAX_LENGTH) {
        return VALIDATION_ERROR_MESSAGES.BUSINESS_ID_TOO_LONG;
      }
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
    let validationErrors = {};

    const variablesValidationError = StartInstanceConfigValidator.validateConfigValue('variables', config.variables);

    if (variablesValidationError) {
      validationErrors['variables'] = variablesValidationError;
    }

    const businessIdValidationError = StartInstanceConfigValidator.validateConfigValue('businessId', config.businessId);

    if (businessIdValidationError) {
      validationErrors['businessId'] = businessIdValidationError;
    }

    return validationErrors;
  }
}

function validateJSON(value, errorMessage) {
  try {
    JSON.parse(value);
  } catch (e) {
    return errorMessage;
  }

  return null;
}