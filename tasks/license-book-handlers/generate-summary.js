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

const { asSummary: createLicensesSummary } = require('license-checker');


module.exports = function generateSummary(processedLicenses, warnings = []) {
  return `${warnings.join('\n')}
Summary of used third party licenses:
${createLicensesSummary(processedLicenses)}
* = license name is deduced from README and/or license text
  `;
};
