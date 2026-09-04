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

const MIN_FEEL_EVALUATION_VERSION = '8.9.0';

export function getFeelPlaygroundConfig(connectionStatus, zeebeApi) {
  connectionStatus ||= {};

  const {
    connection: endpoint,
    response,
    success
  } = connectionStatus;

  if (!success || !endpoint?.id) {
    return {
      evaluationUnavailable: 'No Camunda connection.',
      onEvaluate: undefined
    };
  }

  if (response?.protocol === 'grpc') {
    return {
      evaluationUnavailable: 'FEEL expression evaluation requires a REST connection to a Camunda 8 cluster. The current connection uses gRPC.',
      onEvaluate: undefined
    };
  }

  const gatewayVersion = semver.coerce(response?.gatewayVersion);

  if (!gatewayVersion || semver.lt(gatewayVersion, MIN_FEEL_EVALUATION_VERSION)) {
    return {
      evaluationUnavailable: 'FEEL expression evaluation requires Camunda 8.9 or newer.',
      onEvaluate: undefined
    };
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
      throw new Error(response.reason || 'Failed to evaluate expression.');
    }

    return {
      result: response.response.result,
      warnings: response.response.warnings ?? []
    };
  };
}