/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { notarize } from '@electron/notarize';

export default async function(context) {
  const {
    electronPlatformName,
    appOutDir,
    packager
  } = context;

  if (electronPlatformName !== 'darwin') {
    return;
  }

  const {
    info: {
      options: {
        publish
      }
    }
  } = packager;

  if (publish !== 'always') {
    console.log('  • skipped notarization for non-release');

    return;
  }

  const {
    productName: appName
  } = packager.config;

  const {
    APPLE_DEVELOPER_ID: appleId,
    APPLE_DEVELOPER_ID_PASSWORD: appleIdPassword,
    APPLE_TEAM_ID: appleTeamId
  } = process.env;

  const appPath = `${appOutDir}/${appName}.app`;

  console.log(`  • notarizing app from path: ${appPath}`);

  return await notarize({
    appPath,
    appleId,
    appleIdPassword,
    teamId: appleTeamId,
    tool: 'notarytool'
  });
};
