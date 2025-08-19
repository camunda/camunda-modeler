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

