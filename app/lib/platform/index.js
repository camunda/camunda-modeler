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
  const Platform = require('./' + platformToDirname(platform));

  return new Platform(app, config);
};

function platformToDirname(platform) {
  switch (platform) {
  case 'win32':
    return 'windows';
  case 'darwin':
    return 'mac-os';
  case 'linux':
    return 'linux';
  default:
    throw new Error('your platform < ' + platform + ' > is not supported.');
  }
}
