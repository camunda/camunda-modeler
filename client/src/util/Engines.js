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
    executionPlatformVersions: [ '7.16', '7.15' ]
  },
  {
    executionPlatform: ENGINES.CLOUD,
    executionPlatformVersions: [ '1.3', '1.2', '1.1', '1.0' ]
  }
];
