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

module.exports = function generateSummary(processedLicenses, warnings = []) {
  return `${warnings.join('\n')}
Summary of used third party licenses:
${createLicensesSummary(processedLicenses)}
* = license name is deduced from README and/or license text
  `;
};

function createLicensesSummary(processedLicenses) {
  const licenseCounts = {};

  for (const licenseInfo of processedLicenses) {
    const licenseName = licenseInfo.licenseId || 'unknown';
    licenseCounts[licenseName] = (licenseCounts[licenseName] || 0) + 1;
  }

  return Object.entries(licenseCounts).map(([ licenseName, count ]) => {
    return `- ${licenseName} - ${count}`;
  }).join('\n');
}
