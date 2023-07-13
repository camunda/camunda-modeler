/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/**
 *
 *
 * @returns {{
 *  name: string,
 *  repository: string,
 *  licenseId: string,
 *  licenseText: string,
 *  version: string
 * }[]}
 */
module.exports = function processLicenses(dependencies) {
  const processedLicenses = [];
  const warnings = [];

  for (const dependency of dependencies) {
    const {
      licenseId,
      licenseText,
      packageJson: {
        name,
        repository,
        version
      }
    } = dependency;

    if (!repository) {
      warnings.push(`missing repository: ${name}`);
    }

    if (!licenseText) {
      warnings.push(`missing license text: ${name}`);
    }

    processedLicenses.push({
      name: `${name}@${version}`,
      repository: repository && repository.url || repository,
      licenseId,
      licenseText
    });
  }

  return {
    processedLicenses,
    warnings
  };
};
