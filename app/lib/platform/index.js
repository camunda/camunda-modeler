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

module.exports.create = function create(platform, app, config) {
  let Platform;

  switch (platform) {
  case 'darwin':
    Platform = require('./mac-os');
    break;
  case 'win32':
    Platform = require('./windows');
    break;
  case 'linux':
    Platform = require('./linux');
    break;
  default:
    throw new Error('Unsupported platform: ' + platform);
  }

  return new Platform(app, config);
};
