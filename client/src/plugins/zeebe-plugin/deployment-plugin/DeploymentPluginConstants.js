/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

export const MODAL_TITLE = 'Deploy Diagram';
export const ENDPOINT_CONFIGURATION_TITLE = 'Endpoint Configuration';
export const CANCEL = 'Cancel';
export const DEPLOY = 'Deploy';
export const START = 'Start';

export const DEPLOYMENT_NAME = 'Deployment Name';
export const SELF_HOSTED_TEXT = 'Self-hosted';
export const OAUTH_TEXT = 'OAuth';
export const NONE = 'None';
export const CAMUNDA_CLOUD_TEXT = 'Camunda Cloud';
export const CONTACT_POINT = 'Contact Point';
export const DEPLOYMENT_NAME_HINT = 'Default value is the file name.';
export const CONTACT_POINT_HINT = 'Default value is 0.0.0.0:26500';
export const OAUTH_URL = 'OAuth URL';
export const AUDIENCE = 'Audience';
export const CLIENT_ID = 'Client ID';
export const CLIENT_SECRET = 'Client Secret';
export const CLUSTER_ID = 'Cluster ID';
export const REMEMBER_CREDENTIALS = 'Remember credentials';

export const MUST_PROVIDE_A_VALUE = 'Must provide a value.';
export const CONTACT_POINT_MUST_NOT_BE_EMPTY = 'Contact point must not be empty.';
export const OAUTH_URL_MUST_NOT_BE_EMPTY = 'OAuth URL must not be empty.';
export const AUDIENCE_MUST_NOT_BE_EMPTY = 'Audience must not be empty.';
export const CLIENT_ID_MUST_NOT_BE_EMPTY = 'Client ID must not be empty.';
export const CLIENT_SECRET_MUST_NOT_BE_EMPTY = 'Client Secret must not be empty.';
export const CLUSTER_ID_MUST_NOT_BE_EMPTY = 'Cluster ID must not be empty.';
export const FILL_IN_ALL_THE_FIELDS = 'You must fill in all the fields';

export const ERROR_REASONS = {
  UNKNOWN: 'UNKNOWN',
  CONTACT_POINT_UNAVAILABLE: 'CONTACT_POINT_UNAVAILABLE',
  CLUSTER_UNAVAILABLE: 'CLUSTER_UNAVAILABLE',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  OAUTH_URL: 'OAUTH_URL'
};

export const CONNECTION_ERROR_MESSAGES = {
  [ ERROR_REASONS.CONTACT_POINT_UNAVAILABLE ]: 'Should point to a running Zeebe cluster.',
  [ ERROR_REASONS.CLUSTER_UNAVAILABLE ]: 'Should point to a running Zeebe cluster.',
  [ ERROR_REASONS.UNAUTHORIZED ]: 'Credentials do not match with the server.',
  [ ERROR_REASONS.FORBIDDEN ]: 'This user is not permitted to deploy. Please use different credentials or get this user enabled to deploy.',
  [ ERROR_REASONS.OAUTH_URL ]: 'Should point to a running OAuth service.',
  [ ERROR_REASONS.UNKNOWN ]: 'Unknown error. Please check Zeebe cluster status.'
};
