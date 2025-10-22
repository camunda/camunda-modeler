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
 * Sanitize Camunda client options, so they can safely be logged.
 *
 * @param {Object} options
 *
 * @returns {Object}
 */
module.exports.sanitizeCamundaClientOptions = function(options) {
  return sanitizeObject(options, [
    'ZEEBE_CLIENT_SECRET',
    'CAMUNDA_CONSOLE_CLIENT_SECRET',
    'CAMUNDA_BASIC_AUTH_PASSWORD',
    [ 'CAMUNDA_CUSTOM_ROOT_CERT_STRING', 'blob' ]
  ]);
};

/**
 * Sanitize config with endpoint, so it can safely be logged.
 *
 * @param {Object} config
 *
 * @returns {Object}
 */
module.exports.sanitizeConfigWithEndpoint = function(config) {
  return sanitizeObject(config, [
    'clientSecret',
    'basicAuthPassword'
  ]);
};

/**
 * Sanitize an object by replacing sensitive values with placeholders.
 *
 * @param {Object} obj
 * @param {Array<string|Array<string>>} sanitizations - Array of keys (strings) or [key, type] pairs. Default type is 'secret'.
 *
 * @returns {Object}
 */
function sanitizeObject(obj, sanitizations) {
  const sanitizationTypes = sanitizations.reduce((sanitizationTypes, sanitization) => {
    const [ key, type = 'secret' ] = Array.isArray(sanitization) ? sanitization : [ sanitization ];

    sanitizationTypes[key] = type;

    return sanitizationTypes;
  }, {});

  return cloneObjectWithReplacer(obj, (key, value) => {
    const sanitizationType = sanitizationTypes[key];

    if (sanitizationType === 'secret') {
      return '******';
    }

    if (sanitizationType === 'blob') {
      return '...';
    }

    return value;
  });
}

/**
 * Clone an object with a custom replacer function.
 *
 * @param {Object} obj
 * @param {Function} replacer - Function to replace values during cloning
 *
 * @returns {Object}
 */
function cloneObjectWithReplacer(obj, replacer) {
  return JSON.parse(JSON.stringify(obj, replacer));
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

/**
 * Remove trailing slashes and '/v2' from a URL. This is mainly used for Camunda 8 REST API endpoints as we are inconsistent if we add /v2 or not.
 *
 * @param {string} url
 *
 * @returns {string}
 *
 * @examples
 * removeV2OrSlashes('https://example.com') // returns 'https://example.com'
 * removeV2OrSlashes('https://example.com/') // returns 'https://example.com'
 * removeV2OrSlashes('https://example.com/v2') // returns 'https://example.com'
 * removeV2OrSlashes('https://example.com/v2/') // returns 'https://example.com'
 * removeV2OrSlashes('https://example.com/v2/v2') // returns 'https://example.com/v2' (super edge case, they have to specify v2 explicitly twice)
 */
module.exports.removeV2OrSlashes = function(url) {

  if (!url) {
    return url;
  }
  const parsed = new URL(url);

  let pathname = parsed.pathname || '';

  while (pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }

  if (pathname.endsWith('/v2')) {
    pathname = pathname.slice(0, -3);
  }

  parsed.pathname = pathname || '/';

  return parsed.href.replace(/\/(\?|#|$)/, '$1');
};