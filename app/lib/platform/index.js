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

var requirePlatform = require('../util/require-platform');

module.exports.create = function create(platform, app, config) {
  var Platform = requirePlatform(platform, __dirname);

  return new Platform(app, config);
};
