/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

var RESPONSE_OK = { mocked: true };

module.exports = function(url, options) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(RESPONSE_OK)
  });
};

module.exports.RESPONSE_OK = RESPONSE_OK;