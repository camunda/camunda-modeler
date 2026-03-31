/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import semver from 'semver';


const CLOUD_TAB_TYPES = [ 'cloud-bpmn', 'cloud-dmn', 'cloud-form', 'rpa' ];


/**
 * Lint plugin that produces a warning when the selected execution platform
 * version differs from the connected cluster version.
 *
 * @param {Object} options
 * @param {Object|null} options.connectionCheckResult
 * @param {Object} options.engineProfiles - map of tab ID → { executionPlatformVersion }
 *
 * @return {Function} getWarnings(tab) → Array
 */
export default function VersionMismatchChecker({ connectionCheckResult, engineProfiles }) {

  return function getWarnings(tab) {
    if (!CLOUD_TAB_TYPES.includes(tab.type)) {
      return [];
    }

    const clusterVersion = connectionCheckResult
      && connectionCheckResult.success
      && connectionCheckResult.response
      && connectionCheckResult.response.gatewayVersion;

    const engineProfile = engineProfiles[ tab.id ];
    const selectedVersion = engineProfile && engineProfile.executionPlatformVersion;

    const warning = getVersionMismatchWarning(selectedVersion, clusterVersion);

    return warning ? [ warning ] : [];
  };
}


/**
 * Return a version-mismatch warning object when selected and cluster
 * versions differ at the major.minor level, or null otherwise.
 *
 * @param {string|null} selectedVersion
 * @param {string|null} clusterVersion
 * @return {Object|null}
 */
export function getVersionMismatchWarning(selectedVersion, clusterVersion) {

  if (!selectedVersion || !clusterVersion) {
    return null;
  }

  const selectedCoerced = semver.coerce(selectedVersion);
  const clusterCoerced = semver.coerce(clusterVersion);

  if (!selectedCoerced || !clusterCoerced) {
    return null;
  }

  if (selectedCoerced.major === clusterCoerced.major
    && selectedCoerced.minor === clusterCoerced.minor) {
    return null;
  }

  const clusterMinorVersion = `${ clusterCoerced.major }.${ clusterCoerced.minor }`;

  return {
    category: 'warn',
    name: 'Version mismatch',
    message: `The selected version (${ selectedCoerced.major }.${ selectedCoerced.minor }) differs from the connected cluster version (${ clusterMinorVersion }).`,
    rule: 'camunda/version-mismatch',
    action: {
      label: `Switch to ${ clusterMinorVersion }`,
      handler: 'set-engine-profile',
      options: {
        executionPlatformVersion: `${ clusterMinorVersion }.0`
      }
    }
  };
}
