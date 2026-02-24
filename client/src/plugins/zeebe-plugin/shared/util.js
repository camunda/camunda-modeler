/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { CONNECTION_CHECK_ERROR_MESSAGES } from '../deployment-plugin/ConnectionCheckErrors';

// re-export from shared location
export {
  getOperateUrl,
  getDeploymentUrls,
  getStartInstanceUrl,
  getProcessId,
  getResourceType,
  DEPLOYMENT_TYPES,
  RESOURCE_TYPES
} from '../../../app/zeebe/util';

const GRPC_ERROR_CODES = {
  0: 'OK',
  1: 'CANCELLED',
  2: 'UNKNOWN',
  3: 'INVALID_ARGUMENT',
  4: 'DEADLINE_EXCEEDED',
  5: 'NOT_FOUND',
  6: 'ALREADY_EXISTS',
  7: 'PERMISSION_DENIED',
  8: 'RESOURCE_EXHAUSTED',
  9: 'FAILED_PRECONDITION',
  10: 'ABORTED',
  11: 'OUT_OF_RANGE',
  12: 'UNIMPLEMENTED',
  13: 'INTERNAL',
  14: 'UNAVAILABLE',
  15: 'DATA_LOSS',
  16: 'UNAUTHENTICATED'
};

export function getGRPCErrorCode(response) {
  const {
    code
  } = response;

  return code ? GRPC_ERROR_CODES[ code ] : 'UNKNOWN';
}

export function getMessageForReason(reason) {
  return CONNECTION_CHECK_ERROR_MESSAGES[reason] || CONNECTION_CHECK_ERROR_MESSAGES.UNKNOWN;
}

/**
 * Check if a connection is a c8run local connection.
 *
 * Matches if both conditions are true:
 * - contactPoint starts with http://localhost:8080 (protocol + host:port) (case-insensitive)
 * - name starts with "c8run" (case-insensitive)
 *
 * @param {Endpoint} connection
 *
 * @returns {boolean}
 */
export function isC8RunConnection(connection) {
  if (!connection) {
    return false;
  }

  const urlMatches = /^http:\/\/localhost:8080/i.test(connection.contactPoint);
  const nameMatches = /^c8run/i.test(connection.name);

  return urlMatches && nameMatches;
}
