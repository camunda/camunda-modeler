/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { SETTINGS_KEY_PREFER_CAMUNDA_7 } from '../../plugins/settings/useBuiltInSettings';

const CAMUNDA_7_TAB_TYPES = [ 'bpmn', 'dmn', 'form' ];

/**
 * Prefers Camunda 7 on the start page for users who worked with Camunda 7 files
 * recently. Runs once: a stored choice is never recomputed.
 */
export async function migrateStartPage(settings, config) {
  const storedSettings = await config.get('settings') || {};

  if (SETTINGS_KEY_PREFER_CAMUNDA_7 in storedSettings) {
    return;
  }

  const recentTabs = await config.get('recentTabs') || [];

  const usesCamunda7 = recentTabs.some(tab => CAMUNDA_7_TAB_TYPES.includes(tab?.type));

  settings.set({ [ SETTINGS_KEY_PREFER_CAMUNDA_7 ]: usesCamunda7 });
}
