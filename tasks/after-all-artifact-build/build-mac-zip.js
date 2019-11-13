/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const exec = require('execa').sync;

const del = require('del').sync;

const path = require('path');

/**
 * Build zip artifact for MacOS since electron-builder breaks zips
 *
 * @param {import('electron-builder').BuildResult} context
 *
 * @return {Promise<any>}
 */
module.exports = async function(context) {

  if (!isBuildingMacDistro(context)) {
    return;
  }

  const {
    artifactPaths,
    configuration,
    outDir
  } = context;

  const {
    productName
  } = configuration;

  const dmgPath = artifactPaths.find(path => /\.dmg$/.test(path));
  const zipPath = dmgPath.replace(/dmg$/, 'zip');

  const appDir = path.join(outDir, 'mac');

  console.log(`  • building     target=ZIP arch=x64 file=${zipPath}`);

  del(zipPath);

  exec('zip', [ '--symlinks', '-r', zipPath, `${productName}.app` ], { cwd: appDir });

  // TODO: update dist/latest-mac.yml with blockmap information
  // As of `electron-builder@22.1.0`, the `app-builder-bin` blockmap utility
  // modifies the digested ZIP file and thus makes the central record directory broken.

  return [ zipPath ];
};


function isBuildingMacDistro(context) {
  const {
    platformToTargets
  } = context;

  for (const platform of platformToTargets.keys()) {
    if (platform.name === 'mac') {
      return true;
    }
  }

  return false;
}
