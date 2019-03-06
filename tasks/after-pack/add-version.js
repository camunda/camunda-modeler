/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const fs = require('fs');
const path = require('path');

module.exports = function(context) {

  const {
    appOutDir
  } = context;

  const appInfo = context.packager.appInfo;

  const {
    buildVersion,
    buildNumber
  } = appInfo;

  fs.writeFileSync(
    path.join(appOutDir, 'VERSION'),
    `v${buildVersion} (build ${buildNumber || '0000' })`,
    'utf8'
  );
};