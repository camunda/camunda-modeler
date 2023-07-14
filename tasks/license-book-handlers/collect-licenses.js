/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const collectAppDependencies = require('./collect-app-dependencies');
const collectClientDependencies = require('./collect-client-dependencies');
const optionalDependencies = require('./optional-dependencies');

module.exports = async function() {
  const deps = await Promise.all([
    collectAppDependencies(),
    collectClientDependencies()
  ]);

  return addIfNotPresent(deps.flat(1), optionalDependencies);
};

function addIfNotPresent(arr, toAdd) {
  const missing = toAdd.filter(d => !arr.find(a => a.packageJson.name === d.packageJson.name));

  return arr.concat(missing);
}
