/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { ConnectionManagerSettingsComponent } from './ConnectionManagerSettingsComponent';

export const CONNECTION_MANAGER_PLUGIN_ID = 'connectionManagerPlugin';
export const SETTINGS_KEY_CONNECTIONS = `${CONNECTION_MANAGER_PLUGIN_ID}.c8connections`;

/**
 * Registers plugin settings
 */
export async function initializeSettings({ settings, connectionChecker }) {

  /** @type import("../../../app/Settings").SettingsGroup */
  const pluginSettings = {
    id: CONNECTION_MANAGER_PLUGIN_ID,
    title: 'Camunda 8 cluster connections',
    order: 1,
    properties: {
      [SETTINGS_KEY_CONNECTIONS]: {
        type: 'custom',
        component: (props) => ConnectionManagerSettingsComponent({ ...props, connectionChecker }),
        description: 'Manage Camunda 8 Orchestration Cluster connections.',
      },

    }
  };
  settings.register(pluginSettings);
}
