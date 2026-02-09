/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { generateId } from '../../util';
import { AUTH_TYPES, TARGET_TYPES } from '../../remote/ZeebeAPI';
import { SETTINGS_KEY_CONNECTIONS } from '../../plugins/zeebe-plugin/connection-manager-plugin/ConnectionManagerSettings';

export async function migrateConnections(settings, config) {
  const c8connections = settings.get(SETTINGS_KEY_CONNECTIONS);

  if (!c8connections) {
    const zeebeEndpoints = await config.get('zeebeEndpoints');
    settings.set({ [SETTINGS_KEY_CONNECTIONS]:  [ ...(zeebeEndpoints || []), DEFAULT_ENDPOINT ] });
  }
}

/** @type import('../deployment-plugin/types').Connection */
const DEFAULT_ENDPOINT = {
  id: generateId(),
  name: 'c8run (local)',
  contactPoint: 'http://localhost:8080/v2',
  operateUrl: 'http://localhost:8080/operate',
  tasklistUrl: 'http://localhost:8080/tasklist',
  targetType: TARGET_TYPES.SELF_HOSTED,
  authType: AUTH_TYPES.NONE,
};
