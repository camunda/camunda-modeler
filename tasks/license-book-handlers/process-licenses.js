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

module.exports = function processLicenses(dependencies) {
  const processedLicenses = [];
  const warnings = [];

  for (const name in dependencies) {
    const details = dependencies[name];

    const {
      licenseFile,
      repository,
      licenses
    } = details;

    if (!repository) {
      warnings.push(`missing repository: ${name}`);
    }

    const licenseFileValid = isValidFile(licenseFile);

    if (!licenseFileValid) {
      warnings.push(`missing license file: ${name}`);
    }

    const licenseText = licenseFileValid
      ? fs.readFileSync(licenseFile, 'utf-8')
      : licenses;

    processedLicenses.push({
      ...details,
      name,
      repository,
      licenseText
    });
  }

  return {
    processedLicenses,
    warnings
  };
};

function isValidFile(file) {
  return file && !/README(\.md)?/i.test(file);
}