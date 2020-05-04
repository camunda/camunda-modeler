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

var semver = require('semver');

/**
 * Get the semantic version of the application.
 *
 * @param {Object} pkg
 * @param {Object} options
 * @param {boolean} [options.nightly]
 * @param {string} [options.buildName]
 *
 * @return {string} actual app version
 */
module.exports = function getVersion(pkg, options) {

  var appVersion = pkg.version;

  var {
    buildName,
    nightly
  } = options;

  if (nightly) {
    appVersion = `${semver.inc(appVersion, 'minor')}-nightly.${today()}`;
  } else if (buildName) {
    appVersion = `${appVersion}-${buildName}`;
  }

  return appVersion;
};

function pad(n) {
  if (n < 10) {
    return '0' + n;
  } else {
    return n;
  }
}

function today() {
  const d = new Date();

  return [
    d.getFullYear(),
    pad(d.getMonth() + 1),
    pad(d.getDate())
  ].join('');
}
