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