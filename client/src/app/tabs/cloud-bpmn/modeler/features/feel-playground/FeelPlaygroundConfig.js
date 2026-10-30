/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import semver from 'semver';

import {
  CONNECTION_CHECK_ERROR_REASONS as REASONS
} from '../../../../../../plugins/zeebe-plugin/deployment-plugin/ConnectionCheckErrors';
import { NO_CONNECTION_ID } from '../../../../../../plugins/zeebe-plugin/connection-manager-plugin/constants';
import { isC8RunConnection } from '../../../../../../plugins/zeebe-plugin/shared/util';

const MIN_FEEL_EVALUATION_VERSION = '8.9.0';

const CONNECTION_HELP = {
  [REASONS.CONTACT_POINT_UNAVAILABLE]: {
    title: 'Cannot reach Camunda',
    message: 'Check the cluster URL and your network connection.'
  },
  [REASONS.CLUSTER_UNAVAILABLE]: {
    title: 'Cannot reach Camunda',
    message: 'Check the cluster URL and your network connection.'
  },
  [REASONS.CLUSTER_TEMPORARILY_UNAVAILABLE]: {
    title: 'Camunda is temporarily unavailable',
    message: 'The cluster may be paused or starting up. Wait for it to become available, or select another connection.'
  },
  [REASONS.UNAUTHORIZED]: {
    title: 'Credentials rejected',
    message: 'Check the connection credentials.'
  },
  [REASONS.OAUTH_URL]: {
    title: 'Cannot reach the OAuth endpoint',
    message: 'Check the OAuth URL and your network connection.'
  },
  [REASONS.INVALID_CLIENT_ID]: {
    title: 'Invalid client ID',
    message: 'Check the client ID in your connection settings.'
  },
  [REASONS.INVALID_CREDENTIALS]: {
    title: 'Invalid client secret',
    message: 'Check the client ID and secret in your connection settings.'
  },
  [REASONS.INVALID_CONFIGURATION]: {
    title: 'Invalid connection configuration',
    message: 'Review the required fields in your connection settings.'
  }
};

export function getFeelPlaygroundConfig(connectionStatus, zeebeApi, onConfigureConnection) {
  connectionStatus ||= {};

  const {
    connection: endpoint,
    reason,
    response,
    success
  } = connectionStatus;

  const unavailable = (title, message, actionLabel = 'Manage connection') => ({
    evaluationUnavailable: {
      title,
      message,
      action: actionLabel && onConfigureConnection ? {
        label: actionLabel,
        onClick: onConfigureConnection
      } : undefined
    },
    onEvaluate: undefined
  });

  if (endpoint?.id === NO_CONNECTION_ID) {
    return unavailable('Offline mode', 'Select a Camunda connection to evaluate expressions.', 'Select connection');
  }

  if (reason === REASONS.NO_CONFIG || (!endpoint?.id && success === false)) {
    return unavailable('No connection selected', 'Select a Camunda connection to evaluate expressions.', 'Select connection');
  }

  if (success === undefined) {
    return endpoint?.id
      ? unavailable('Checking connection', 'Waiting for the Camunda connection check to finish.', null)
      : unavailable('Loading connection', 'Resolving the Camunda connection for this file.', null);
  }

  if (!success) {
    if ([ REASONS.CONTACT_POINT_UNAVAILABLE, REASONS.CLUSTER_UNAVAILABLE ].includes(reason) && isC8RunConnection(endpoint)) {
      return unavailable('Cannot reach local Camunda 8 Run', 'Start Camunda 8 Run, then check the connection.', 'Check connection');
    }

    if (reason === REASONS.FORBIDDEN) {
      return unavailable('Access denied', 'Ask your administrator to grant access, or use different credentials.');
    }

    if (reason === REASONS.UNSUPPORTED_ENGINE) {
      return unavailable('Unsupported Camunda version', 'Select a REST connection to Camunda 8.9 or newer.', 'Select connection');
    }

    if (CONNECTION_HELP[reason]) {
      const { title, message } = CONNECTION_HELP[reason];
      return unavailable(title, message);
    }

    return unavailable('Connection check failed', 'Check the connection settings and cluster status.', 'Check connection');
  }

  if (!endpoint?.id) {
    return unavailable('No connection selected', 'Select a Camunda connection to evaluate expressions.', 'Select connection');
  }

  if (response?.protocol === 'grpc') {
    return unavailable('REST connection required', 'This connection uses gRPC. Select a REST connection to Camunda 8.9 or newer.', 'Select connection');
  }

  const gatewayVersion = semver.coerce(response?.gatewayVersion);

  if (!gatewayVersion) {
    return unavailable('Camunda version unavailable', 'Check the connection; evaluation requires Camunda 8.9 or newer.', 'Check connection');
  }

  if (semver.lt(gatewayVersion, MIN_FEEL_EVALUATION_VERSION)) {
    return unavailable('Camunda 8.9 or newer required', `Connected to Camunda ${ gatewayVersion }. Select a newer cluster to evaluate expressions.`, 'Select connection');
  }

  return {
    evaluationUnavailable: undefined,
    onEvaluate: createFeelEvaluator(zeebeApi, endpoint)
  };
}

export function createFeelEvaluator(zeebeApi, endpoint) {
  return async ({ expression, context }, { signal }) => {
    signal.throwIfAborted();

    const response = await zeebeApi.evaluateExpression(
      { endpoint },
      `=${ expression.replace(/^=/, '') }`,
      context
    );

    signal.throwIfAborted();

    if (!response.success) {
      const reason = response.reason?.toLowerCase() || 'unknown error';
      throw new Error(`Failed to evaluate expression. Reason: ${reason}`);
    }

    return {
      result: response.response.result,
      warnings: response.response.warnings ?? []
    };
  };
}