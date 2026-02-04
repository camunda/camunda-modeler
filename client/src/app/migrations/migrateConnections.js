/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { SETTINGS_KEY_CONNECTIONS } from '../../plugins/zeebe-plugin/connection-manager-plugin/ConnectionManagerSettings';
import { DEFAULT_ENDPOINT } from '../../plugins/zeebe-plugin/connection-manager-plugin/ConnectionManagerPlugin';

export async function migrateConnections(settings, config) {
  const c8connections = settings.get(SETTINGS_KEY_CONNECTIONS);

  if (!c8connections) {
    const zeebeEndpoints = await config.get('zeebeEndpoints');
    settings.set({ [SETTINGS_KEY_CONNECTIONS]:  [ ...(zeebeEndpoints || []), DEFAULT_ENDPOINT ] });
  }
}
