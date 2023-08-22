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

var IS_DEV = process.env.NODE_ENV !== 'production';
var BUILD_NAME = process.env.BUILD_NAME;
var IS_NIGHTLY = process.env.NIGHTLY;

var pkg = require('../package.json');

/**
 * Get the semantic version of the application.
 *
 * @param {Object} pkg
 * @param {Object} options
 * @param {boolean} [options.nightly]
 * @param {boolean} [options.increment]
 * @param {string} [options.buildName]
 *
 * @return {string} actual app version
 */
module.exports = function getVersion() {
  var appVersion = pkg.version;
  var increment = IS_NIGHTLY || IS_DEV;

  if (increment) {
    appVersion = semver.inc(appVersion, 'minor');
  }

  if (IS_NIGHTLY) {
    appVersion = `${appVersion}-nightly.${today()}`;
  } else if (BUILD_NAME) {
    appVersion = `${appVersion}-${BUILD_NAME}`;
  } else if (IS_DEV) {
    appVersion = `${appVersion}-dev`;
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
