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
  endpointUrl: validateEndpointUrl,
  deploymentName: validateDeploymentName,
  username: validateUsername,
  password: validatePassword,
  bearer: validateBearer
};

function validateEndpointUrl(url) {
  if (!url.length) {
    return 'Endpoint URL must not be empty.';
  }

  if (!/^https?:\/\/.+/.test(url)) {
    return 'Endpoint URL must start with "http://" or "https://".';
  }
}

function validateDeploymentName(name) {
  if (!name.length) {
    return 'Deployment name must not be empty.';
  }
}

function validateUsername(username) {
  if (!username.length) {
    return 'Username must not be empty.';
  }
}

function validatePassword(password) {
  if (!password.length) {
    return 'Password must not be empty.';
  }
}

function validateBearer(bearer) {
  if (!bearer.length) {
    return 'Token must not be empty.';
  }
}
