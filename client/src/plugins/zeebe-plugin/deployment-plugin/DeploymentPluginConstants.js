/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

export const OVERLAY_TITLE = 'Deploy diagram';
export const ENDPOINT_CONFIGURATION_TITLE = 'Endpoint configuration';
export const CANCEL = 'Cancel';
export const DEPLOY = 'Deploy';
export const NEXT = 'Next';

export const DEPLOYMENT_NAME = 'Deployment name';
export const SELF_HOSTED_TEXT = 'Camunda 8 Self-Managed';
export const NONE = 'None';
export const BASIC_AUTH_TEXT = 'Basic';
export const OAUTH_TEXT = 'OAuth';
export const CAMUNDA_CLOUD_TEXT = 'Camunda 8 SaaS';
export const CONTACT_POINT = 'Cluster endpoint';
export const DEPLOYMENT_NAME_HINT = 'Default value is the file name.';
export const CONTACT_POINT_HINT = 'http://localhost:26500';
export const BASIC_AUTH_USERNAME = 'Username';
export const BASIC_AUTH_PASSWORD = 'Password';
export const OAUTH_URL = 'OAuth token URL';
export const AUDIENCE = 'OAuth audience';
export const SCOPE = 'OAuth scope';
export const CLIENT_ID = 'Client ID';
export const CLIENT_SECRET = 'Client secret';
export const CLUSTER_URL = 'Cluster URL';
export const REMEMBER_CREDENTIALS = 'Remember credentials';
export const TENANT_ID = 'Tenant ID';

export const MUST_PROVIDE_A_VALUE = 'Must provide a value.';
export const CONTACT_POINT_MUST_NOT_BE_EMPTY = 'Cluster endpoint must not be empty.';
export const CONTACT_POINT_MUST_START_WITH_PROTOCOL = 'Cluster endpoint must start with "http://" or "https://".';
export const CONTACT_POINT_MUST_BE_URL = 'Cluster endpoint must be a valid URL.';
export const BASIC_AUTH_USERNAME_MUST_NOT_BE_EMPTY = 'Username must not be empty.';
export const BASIC_AUTH_PASSWORD_MUST_NOT_BE_EMPTY = 'Password must not be empty.';
export const OAUTH_URL_MUST_NOT_BE_EMPTY = 'OAuth URL must not be empty.';
export const AUDIENCE_MUST_NOT_BE_EMPTY = 'Audience must not be empty.';
export const CLIENT_ID_MUST_NOT_BE_EMPTY = 'Client ID must not be empty.';
export const CLIENT_SECRET_MUST_NOT_BE_EMPTY = 'Client Secret must not be empty.';
export const FILL_IN_ALL_THE_FIELDS = 'You must fill in all the fields';
export const CLUSTER_URL_MUST_BE_VALID_CLOUD_URL = 'Must be a valid Camunda 8 SaaS URL.';
export const TROUBLESHOOTING_URL = 'https://docs.camunda.io/docs/components/modeler/desktop-modeler/troubleshooting/#i-cannot-connect-to-zeebe';

export const ERROR_REASONS = {
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

export const CONNECTION_ERROR_MESSAGES = {
  [ ERROR_REASONS.CONTACT_POINT_UNAVAILABLE ]: 'Cannot connect to Zeebe cluster.',
  [ ERROR_REASONS.CLUSTER_UNAVAILABLE ]: 'Cannot connect to Zeebe cluster.',
  [ ERROR_REASONS.UNAUTHORIZED ]: 'Credentials rejected by server.',
  [ ERROR_REASONS.FORBIDDEN ]: 'This user is not permitted to deploy. Please use different credentials or get this user enabled to deploy.',
  [ ERROR_REASONS.OAUTH_URL ]: 'Cannot connect to OAuth token endpoint.',
  [ ERROR_REASONS.UNKNOWN ]: 'Unknown error. Please check Zeebe cluster status.',
  [ ERROR_REASONS.UNSUPPORTED_ENGINE ]: 'Unsupported Zeebe version.',
  [ ERROR_REASONS.INVALID_CLIENT_ID ]: 'Invalid Client ID.',
  [ ERROR_REASONS.INVALID_CREDENTIALS ]: 'The client secret is not valid for the client ID provided.'
};
