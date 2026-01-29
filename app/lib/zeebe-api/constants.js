/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

module.exports.AUTH_TYPES = {
  NONE: 'none',
  BASIC: 'basic',
  OAUTH: 'oauth',
  BEARER: 'bearer',
  OIDC: 'oidc'
};

module.exports.ENDPOINT_TYPES = {
  SELF_HOSTED: 'selfHosted',
  CAMUNDA_CLOUD: 'camundaCloud'
};

module.exports.RESOURCE_TYPES = {
  BPMN: 'bpmn',
  DMN: 'dmn',
  FORM: 'form'
};
