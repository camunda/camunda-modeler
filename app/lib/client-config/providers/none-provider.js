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

/**
 * Nop, you aint gonna load this configuration.
 */
function NoneProvider() {

  this.get = function() {

    var key = arguments[0];
    var done = arguments[arguments.length - 1];

    return done(new Error('no provider for <' + key + '>'));
  };
}

module.exports = NoneProvider;