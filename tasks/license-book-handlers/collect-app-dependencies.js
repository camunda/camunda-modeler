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

const fs = require('fs/promises');

const exec = require('execa');

module.exports = async function collectAppDependencies() {

  await exec('npm', [ 'run', 'app:collect-licenses' ], {
    cwd: process.cwd(),
    stdio: 'inherit'
  });

  const dependencies = await fs.readFile('tmp/dependencies.json', 'utf-8');

  return JSON.parse(dependencies);
};
