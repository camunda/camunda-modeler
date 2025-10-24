/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

export const ENGINES = {
  PLATFORM: 'Camunda Platform',
  CLOUD: 'Camunda Cloud'
};

export const ENGINE_PROFILES = [
  {
    executionPlatform: ENGINES.PLATFORM,
    executionPlatformVersions: [ '7.24.0', '7.23.0', '7.22.0', '7.21.0', '7.20.0', '7.19.0', '7.18.0', '7.17.0', '7.16.0', '7.15.0' ],
    latestStable: '7.24.0'
  },
  {
    executionPlatform: ENGINES.CLOUD,
    executionPlatformVersions: [ '8.9.0', '8.8.0', '8.7.0', '8.6.0', '8.5.0', '8.4.0', '8.3.0', '8.2.0', '8.1.0', '8.0.0' ],
    latestStable: '8.8.0'
  }
];

export const ENGINE_LABELS = {
  [ ENGINES.PLATFORM ]: 'Camunda 7',
  [ ENGINES.CLOUD ]: 'Camunda 8'
};

export function getLatestStable(platform) {
  const profile = ENGINE_PROFILES.find(
    p => p.executionPlatform === platform
  );

  if (!profile) {
    throw new Error(`no profile for platform <${platform}>`);
  }

  return profile.latestStable;
}
