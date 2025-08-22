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
 * Filter Camunda8 options, so they can safely logged
 * without leaking secrets.
 *
 * @param {any} options
 *
 * @returns {any} filtered options
 */
module.exports.redactCamunda8Options = function(options) {
  return redactDeep(options, [
    'ZEEBE_CLIENT_SECRET:secret',
    'CAMUNDA_CONSOLE_CLIENT_SECRET:secret',
    'CAMUNDA_BASIC_AUTH_PASSWORD:secret',
    'CAMUNDA_CUSTOM_ROOT_CERT_STRING:blob'
  ]);
};

/**
 * Filter endpoint connection parameters, so they can safely logged
 * without leaking secrets.
 *
 * @param {any} parameters
 *
 * @returns {any} filtered parameters
 */
module.exports.redactEndpointParameters = function(parameters) {
  return redactDeep(parameters, [
    'clientSecret:secret',
    'basicAuthPassword:secret'
  ]);
};


function redactDeep(obj, keys) {

  const overrides = keys.reduce((overrides, name) => {
    const [ key, type ] = name.split(':');

    overrides[key] = type;

    return overrides;
  }, {});

  return JSON.parse(
    JSON.stringify(obj, (key, value) => {
      const override = overrides[key];

      if (override === 'secret') {
        return '******';
      }

      if (override === 'blob') {
        return '...';
      }

      return value;
    })
  );
}

/**
 * Checks if the given URL is a SaaS URL.
 *
 * @example
 *
 * isSaasUrl('https://foo.zeebe.camunda.io'); // true
 * isSaasUrl('https://foo.zeebe.camunda.io:443'); // true
 * isSaasUrl('https://foo.zeebe.example.com:443'); // false
 *
 * @param {string} url
 *
 * @returns {boolean}
 */
function isSaasUrl(url) {
  return isGrpcSaasUrl(url) || isRestSaasUrl(url);
}
module.exports.isSaasUrl = isSaasUrl;

/**
 * Checks if the given URL is a gRPC client SaaS URL.
 *
 * @example
 *
 * isGrpcSaasUrl('https://foo.jfk-1.zeebe.camunda.io:443/'); // true
 * isGrpcSaasUrl('https://foo.jfk-1.zeebe.camunda.io'); // true
 * isGrpcSaasUrl('grpcs://foo.jfk-1.zeebe.camunda.io'); // true
 * isGrpcSaasUrl('https://foo.zeebe.camunda.com:443'); // false
 * isGrpcSaasUrl('https://foo.zeebe.camunda.io:443/bpmn'); // false
 *
 * @param {string} url
 *
 * @returns {boolean}
 */
function isGrpcSaasUrl(url) {
  return /^((https|grpcs):\/\/|)[a-z\d-]+\.[a-z]+-\d+\.zeebe\.camunda\.io(:443|)\/?/.test(url);
}
module.exports.isGrpcSaasUrl = isGrpcSaasUrl;

/**
 * Checks if the given URL is a REST client SaaS URL.
 *
 * @example
 *
 * isRestSaasUrl('https://jfk-1.zeebe.camunda.io:443/foo'); // true
 * isRestSaasUrl('https://jfk-1.zeebe.camunda.io/foo'); // true
 * isRestSaasUrl('https://jfk-1.zeebe.camunda.io:443/'); // false
 * isRestSaasUrl('https://bar.zeebe.camunda.io:443/foo'); // false
 *
 * @param {string} url
 *
 * @returns {boolean}
 */
function isRestSaasUrl(url) {
  return /^https:\/\/[a-z]+-\d+\.zeebe\.camunda\.io(:443|)\/[a-z\d-]+\/?/.test(url);
}
module.exports.isRestSaasUrl = isRestSaasUrl;