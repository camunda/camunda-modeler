/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

'use strict';

var sinon = require('sinon');

/**
 * Spy on all public API (i.e. non _... methods) of an object.
 *
 * @param {Object} object
 *
 * @return {Function} spy reset function
 */
module.exports = function spyOn(object) {

  var spies = [];

  Object.keys(object).forEach(function(key) {

    var value = object[key];

    if (/^_/.test(key) || typeof value !== 'function') {
      return;
    }

    value = object[key] = sinon.spy(value);

    spies.push(value);
  });

  return function() {
    spies.forEach(function(s) {
      s.reset();
    });
  };
};
