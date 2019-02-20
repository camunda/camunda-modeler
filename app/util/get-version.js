/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

var semver = require('semver');

/**
 * Get the semantic version of the application.
 *
 * @param {Object} pkg
 * @param {Object} options
 * @param {String|Boolean} [options.nightly=false] (specify dev or nightly)
 *
 * @return {String} actual app version
 */
module.exports = function getVersion(pkg, options) {

  var appVersion = pkg.version;

  var nightly = options.nightly;

  if (nightly) {
    appVersion = semver.inc(appVersion, 'minor') + '-' + nightly;
  }

  return appVersion;
};