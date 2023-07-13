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

const path = require('path');

const fs = require('fs/promises');

const exec = require('execa').sync;

module.exports = async function collectClientDependencies() {

  await exec('npm', [ 'run', 'build' ], {
    cwd: path.join(process.cwd(), 'client'),
    env: {
      LICENSE_CHECK: '1'
    },
    stdio: 'inherit'
  });

  const dependencies = await fs.readFile('app/public/dependencies.json', 'utf-8');

  return JSON.parse(dependencies);
};
