/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { validateProperties } from '../../settings/SettingsForm';

import { properties } from './ConnectionManagerSettingsProperties';

export function validateConnection(connection) {
  return validateProperties(connection, properties);
}

export function cleanupConnections(connections) {
  if (!connections || !Array.isArray(connections)) {
    return [];
  }

  // ensure connections have an id
  return connections.filter(connection => connection && !!connection.id);
}