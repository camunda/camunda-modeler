/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/**
 * @typedef {import('./types').ConnectionCheckResult} ConnectionCheckResult
 */

import React from 'react';

export const TROUBLESHOOTING_URL = 'https://docs.camunda.io/docs/components/modeler/desktop-modeler/troubleshooting/#i-cannot-connect-to-zeebe';

export const CONNECTION_CHECK_ERROR_REASONS = {
  UNKNOWN: 'UNKNOWN',
  CONTACT_POINT_UNAVAILABLE: 'CONTACT_POINT_UNAVAILABLE',
  CLUSTER_UNAVAILABLE: 'CLUSTER_UNAVAILABLE',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  OAUTH_URL: 'OAUTH_URL',
  UNSUPPORTED_ENGINE: 'UNSUPPORTED_ENGINE',
  INVALID_CLIENT_ID: 'INVALID_CLIENT_ID',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS'
};

export const CONNECTION_CHECK_ERROR_MESSAGES = {
  [ CONNECTION_CHECK_ERROR_REASONS.CONTACT_POINT_UNAVAILABLE ]: 'Cannot connect to Zeebe cluster.',
  [ CONNECTION_CHECK_ERROR_REASONS.CLUSTER_UNAVAILABLE ]: 'Cannot connect to Zeebe cluster.',
  [ CONNECTION_CHECK_ERROR_REASONS.UNAUTHORIZED ]: 'Credentials rejected by server.',
  [ CONNECTION_CHECK_ERROR_REASONS.FORBIDDEN ]: 'This user is not permitted to deploy. Please use different credentials or get this user enabled to deploy.',
  [ CONNECTION_CHECK_ERROR_REASONS.OAUTH_URL ]: 'Cannot connect to OAuth token endpoint.',
  [ CONNECTION_CHECK_ERROR_REASONS.UNKNOWN ]: 'Unknown error. Please check Zeebe cluster status.',
  [ CONNECTION_CHECK_ERROR_REASONS.UNSUPPORTED_ENGINE ]: 'Unsupported Zeebe version.',
  [ CONNECTION_CHECK_ERROR_REASONS.INVALID_CLIENT_ID ]: 'Invalid Client ID.',
  [ CONNECTION_CHECK_ERROR_REASONS.INVALID_CREDENTIALS ]: 'The client secret is not valid for the client ID provided.'
};

/**
 * Get connection validation error message for field name.
 *
 * @param {string} fieldName
 * @param {ConnectionCheckResult} connectionCheckResult
 *
 * @returns {string|React.ReactNode|null}
 */
export function getConnectionCheckError(fieldName, connectionCheckResult) {
  if (!connectionCheckResult) {
    return null;
  }

  const {
    success,
    reason
  } = connectionCheckResult;

  if (success) {
    return null;
  }

  switch (reason) {
  case CONNECTION_CHECK_ERROR_REASONS.CONTACT_POINT_UNAVAILABLE:
    return fieldName === 'endpoint.contactPoint' && (
      <>
        { CONNECTION_CHECK_ERROR_MESSAGES[ reason ] } <a href={ TROUBLESHOOTING_URL }>Troubleshoot</a>
      </>
    );
  case CONNECTION_CHECK_ERROR_REASONS.CLUSTER_UNAVAILABLE:
    return fieldName === 'endpoint.camundaCloudClusterUrl' && (
      <>
        { CONNECTION_CHECK_ERROR_MESSAGES[ reason ] } <a href={ TROUBLESHOOTING_URL }>Troubleshoot</a>
      </>
    );
  case CONNECTION_CHECK_ERROR_REASONS.UNSUPPORTED_ENGINE:
    return [
      'endpoint.camundaCloudClusterUrl',
      'endpoint.contactPoint'
    ].includes(fieldName) && CONNECTION_CHECK_ERROR_MESSAGES[ reason ];
  case CONNECTION_CHECK_ERROR_REASONS.UNAUTHORIZED:
  case CONNECTION_CHECK_ERROR_REASONS.FORBIDDEN:
    return [
      'endpoint.audience',
      'endpoint.camundaCloudClientId',
      'endpoint.camundaCloudClientSecret',
      'endpoint.clientId',
      'endpoint.clientSecret',
      'endpoint.scope'
    ].includes(fieldName) && CONNECTION_CHECK_ERROR_MESSAGES[ reason ];
  case CONNECTION_CHECK_ERROR_REASONS.OAUTH_URL:
    return fieldName === 'endpoint.oauthURL' && CONNECTION_CHECK_ERROR_MESSAGES[ reason ];
  case CONNECTION_CHECK_ERROR_REASONS.UNKNOWN:
    return [
      'endpoint.camundaCloudClusterUrl',
      'endpoint.contactPoint',
      'endpoint.oauthURL'
    ].includes(fieldName) && (
      <>
        { CONNECTION_CHECK_ERROR_MESSAGES[ reason ] } <a href={ TROUBLESHOOTING_URL }>Troubleshoot</a>
      </>
    );
  case CONNECTION_CHECK_ERROR_REASONS.INVALID_CLIENT_ID:
    return fieldName === 'endpoint.camundaCloudClientId' && CONNECTION_CHECK_ERROR_MESSAGES[ reason ];
  case CONNECTION_CHECK_ERROR_REASONS.INVALID_CREDENTIALS:
    return fieldName === 'endpoint.camundaCloudClientSecret' && CONNECTION_CHECK_ERROR_MESSAGES[ reason ];
  }
}