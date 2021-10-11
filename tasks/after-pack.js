/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const handlers = [
  require('./after-pack/add-version'),
  require('./after-pack/add-platform-files'),
  require('./after-pack/set-permissions')
];


async function afterPack(context) {
  return Promise.all(
    handlers.map(h => h(context))
  );
}

module.exports = afterPack;
