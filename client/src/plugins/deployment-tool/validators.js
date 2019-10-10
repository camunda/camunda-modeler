/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

export default {
  bearer: validateBearer,
  deploymentName: validateDeploymentName,
  endpointUrl: validateEndpointUrl,
  password: validatePassword,
  username: validateUsername
};

function validateBearer(bearer) {
  if (!bearer) {
    return 'Token must not be empty.';
  }
}

function validateDeploymentName(name) {
  if (!name) {
    return 'Deployment name must not be empty.';
  }
}

function validateEndpointUrl(url) {
  if (!url) {
    return 'Endpoint URL must not be empty.';
  }

  if (!/^https?:\/\/.+/.test(url)) {
    return 'Endpoint URL must start with "http://" or "https://".';
  }
}

function validatePassword(password) {
  if (!password) {
    return 'Password must not be empty.';
  }
}

function validateUsername(username) {
  if (!username) {
    return 'Username must not be empty.';
  }
}