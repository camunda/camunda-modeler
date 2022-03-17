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
    executionPlatformVersions: [ '7.17.0', '7.16.0', '7.15.0' ]
  },
  {
    executionPlatform: ENGINES.CLOUD,
    executionPlatformVersions: [ '8.0.0', '1.3.0', '1.2.0', '1.1.0', '1.0.0' ]
  }
];

export const ENGINE_LABELS = {
  'Camunda Platform':'Camunda Platform 7',
  'Camunda Cloud': 'Camunda Platform 8'
};
