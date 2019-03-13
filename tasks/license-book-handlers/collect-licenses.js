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

const licenseChecker = require('license-checker');

/**
 * @typedef {Object} PackageInfo
 * @property {string} name
 * @property {(Object) => boolean} [filter]
 */

/**
 * @param  {PackageInfo[]} packages
 */
module.exports = async function collectLicenses(...packages) {
  let combinedLicenses = {};

  for (const pkg of packages) {
    const { name, filter } = pkg;

    const packageLicenses = await collectPackageLicenses(name, filter);

    combinedLicenses = { ...combinedLicenses, ...packageLicenses };
  }

  return combinedLicenses;
};

async function collectPackageLicenses(pkg, filter) {
  console.log(`${pkg}: scanning licenses`);

  const licenses = await scanLicenses(pkg);

  if (!filter) {
    return licenses;
  }

  return Object.entries(licenses).filter(
    (entry) => {
      const [ name ] = entry;

      return filter(name);
    }
  ).reduce(
    (result, entry) => {
      const [ name, details ] = entry;

      return {
        ...result,
        [name]: details
      };
    }, {}
  );
}


function scanLicenses(pkg) {

  const args = {
    production: true,
    start: path.join(process.cwd(), pkg),
    excludePrivatePackages: true
  };

  return new Promise(function(resolve, reject) {

    licenseChecker.init(args, function(err, json) {

      if (err) {
        return reject(err);
      }

      return resolve(json);

    });

  });

}
