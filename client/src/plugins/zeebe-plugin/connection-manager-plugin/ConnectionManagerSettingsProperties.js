/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { AUTH_TYPES, TARGET_TYPES } from '../../../remote/ZeebeAPI';
import { generateId } from '../../../util';

const LABELS = {
  AUTHENTICATION: 'Authentication',
  AUTH_TYPE_BASIC_AUTH: 'Basic',
  AUTH_TYPE_NONE: 'None',
  AUTH_TYPE_OAUTH: 'OAuth',
  BASIC_AUTH_PASSWORD: 'Password',
  BASIC_AUTH_USERNAME: 'Username',
  CAMUNDA_CLOUD: 'Camunda 8 SaaS',
  CLIENT_ID: 'Client ID',
  CLIENT_SECRET: 'Client secret',
  CLUSTER_URL: 'Cluster URL',
  OAUTH_AUDIENCE: 'OAuth audience',
  OAUTH_SCOPE: 'OAuth scope',
  OAUTH_URL: 'OAuth token URL',
  SELF_HOSTED: 'Camunda 8 Self-Managed',
  TARGET: 'Target',
  TENANT_ID: 'Tenant ID',
  OPERATE_URL: 'Operate URL'
};

const HINTS = {
  CLUSTER_URL: 'http://localhost:8080/v2',
  TENANT_ID: 'Optional',
  OPERATE_URL: 'Optional'
};

const VALIDATION_ERROR_MESSAGES = {
  AUDIENCE_MUST_NOT_BE_EMPTY: 'Audience must not be empty.',
  BASIC_AUTH_PASSWORD_MUST_NOT_BE_EMPTY: 'Password must not be empty.',
  BASIC_AUTH_USERNAME_MUST_NOT_BE_EMPTY: 'Username must not be empty.',
  CLIENT_ID_MUST_NOT_BE_EMPTY: 'Client ID must not be empty.',
  CLIENT_SECRET_MUST_NOT_BE_EMPTY: 'Client secret must not be empty.',
  CLUSTER_URL_MUST_BE_VALID_CLOUD_URL: 'Must be a valid Camunda 8 SaaS URL.',
  CONTACT_POINT_MUST_BE_URL: 'Cluster URL must be a valid URL.',
  CONTACT_POINT_MUST_NOT_BE_EMPTY: 'Cluster URL must not be empty.',
  CLUSTER_URL_MUST_NOT_BE_EMPTY: 'Cluster URL must not be empty.',
  CLUSTER_URL_MUST_START_WITH_PROTOCOL: 'Cluster URL must start with "http://", "grpc://", "https://", or "grpcs://".',
  MUST_PROVIDE_A_VALUE: 'Must provide a value.',
  OAUTH_URL_MUST_NOT_BE_EMPTY: 'OAuth URL must not be empty.'
};

const REGEXES = {
  URL: /^(http|grpc)s?:\/\//,
  CAMUNDA_CLOUD_GRPC_URL: /^((https|grpcs):\/\/|)[a-z\d-]+\.[a-z]+-\d+\.zeebe\.camunda\.io(:443|)\/?$/,
  CAMUNDA_CLOUD_REST_URL: /^https:\/\/[a-z]+-\d+\.zeebe\.camunda\.io(:443|)\/[a-z\d-]+\/?$/
};
REGEXES.CAMUNDA_CLOUD_URL = new RegExp(
  `${REGEXES.CAMUNDA_CLOUD_GRPC_URL.source}|${REGEXES.CAMUNDA_CLOUD_REST_URL.source}`
);

export const properties = [
  {
    key: 'targetType',
    type: 'radio',
    label: LABELS.TARGET,
    options: [
      { value: TARGET_TYPES.CAMUNDA_CLOUD, label: LABELS.CAMUNDA_CLOUD },
      { value: TARGET_TYPES.SELF_HOSTED, label: LABELS.SELF_HOSTED }
    ],
    default: TARGET_TYPES.CAMUNDA_CLOUD
  },

  { key: 'camundaCloudClusterUrl',
    type: 'text',
    label: LABELS.CLUSTER_URL,
    condition: { property: 'targetType', equals: TARGET_TYPES.CAMUNDA_CLOUD },
    constraints: {
      notEmpty: VALIDATION_ERROR_MESSAGES.CLUSTER_URL_MUST_NOT_BE_EMPTY,
      pattern: {
        value: REGEXES.CAMUNDA_CLOUD_URL,
        message: VALIDATION_ERROR_MESSAGES.CLUSTER_URL_MUST_BE_VALID_CLOUD_URL
      }
    }
  },
  { key: 'camundaCloudClientId',
    type: 'text',
    label: LABELS.CLIENT_ID,
    condition: { property: 'targetType', equals: TARGET_TYPES.CAMUNDA_CLOUD },
    constraints: {
      notEmpty: VALIDATION_ERROR_MESSAGES.CLIENT_ID_MUST_NOT_BE_EMPTY
    }
  },
  { key: 'camundaCloudClientSecret',
    type: 'password',
    label: LABELS.CLIENT_SECRET,
    condition: { property: 'targetType', equals: TARGET_TYPES.CAMUNDA_CLOUD },
    constraints: {
      notEmpty: VALIDATION_ERROR_MESSAGES.CLIENT_SECRET_MUST_NOT_BE_EMPTY
    }
  },

  { key: 'contactPoint',
    type: 'text',
    label: LABELS.CLUSTER_URL,
    condition: { property: 'targetType', equals: TARGET_TYPES.SELF_HOSTED },
    constraints: {
      notEmpty: VALIDATION_ERROR_MESSAGES.CONTACT_POINT_MUST_NOT_BE_EMPTY,
      pattern: {
        value: REGEXES.URL,
        message: VALIDATION_ERROR_MESSAGES.CONTACT_POINT_MUST_BE_URL
      }
    }
  },

  { key: 'tenantId',
    type: 'text',
    label: LABELS.TENANT_ID,
    hint: HINTS.TENANT_ID,
    condition: { property: 'targetType', equals: TARGET_TYPES.SELF_HOSTED },
  },

  { key: 'operateUrl',
    type: 'text',
    label: LABELS.OPERATE_URL,
    hint: HINTS.OPERATE_URL,
    condition: { property: 'targetType', equals: TARGET_TYPES.SELF_HOSTED }
  },

  { key: 'authType',
    type: 'radio',
    label: LABELS.AUTHENTICATION,
    options: [
      { value: AUTH_TYPES.NONE, label: LABELS.AUTH_TYPE_NONE },
      { value: AUTH_TYPES.BASIC, label: LABELS.AUTH_TYPE_BASIC_AUTH },
      { value: AUTH_TYPES.OAUTH, label: LABELS.AUTH_TYPE_OAUTH },
      { value: 'oidc', label: 'OIDC' }
    ],
    default: AUTH_TYPES.NONE,
    condition: { property: 'targetType', equals: TARGET_TYPES.SELF_HOSTED }
  },

  { key: 'basicAuthUsername',
    type: 'text',
    label: LABELS.BASIC_AUTH_USERNAME,
    condition: {
      allMatch: [
        { property: 'targetType', equals: TARGET_TYPES.SELF_HOSTED },
        { property: 'authType', equals: AUTH_TYPES.BASIC }
      ]
    },
    constraints: {
      notEmpty: VALIDATION_ERROR_MESSAGES.BASIC_AUTH_USERNAME_MUST_NOT_BE_EMPTY
    }
  },
  { key: 'basicAuthPassword',
    type: 'password',
    label: LABELS.BASIC_AUTH_PASSWORD,
    condition: {
      allMatch: [
        { property: 'targetType', equals: TARGET_TYPES.SELF_HOSTED },
        { property: 'authType', equals: AUTH_TYPES.BASIC }
      ]
    },
    constraints: {
      notEmpty: VALIDATION_ERROR_MESSAGES.BASIC_AUTH_PASSWORD_MUST_NOT_BE_EMPTY
    }
  },

  { key: 'clientId',
    type: 'text',
    label: LABELS.CLIENT_ID,
    condition: {
      allMatch: [
        { property: 'targetType', equals: TARGET_TYPES.SELF_HOSTED },
        { property: 'authType', equals: AUTH_TYPES.OAUTH }
      ]
    },
    constraints: {
      notEmpty: VALIDATION_ERROR_MESSAGES.CLIENT_ID_MUST_NOT_BE_EMPTY
    }
  },
  { key: 'clientSecret',
    type: 'password',
    label: LABELS.CLIENT_SECRET,
    condition: {
      allMatch: [
        { property: 'targetType', equals: TARGET_TYPES.SELF_HOSTED },
        { property: 'authType', equals: AUTH_TYPES.OAUTH },
      ]
    },
    constraints: {
      notEmpty: VALIDATION_ERROR_MESSAGES.CLIENT_SECRET_MUST_NOT_BE_EMPTY
    }
  },
  { key: 'oauthURL',
    type: 'text',
    label: LABELS.OAUTH_URL,
    condition: {
      allMatch: [
        { property: 'targetType', equals: TARGET_TYPES.SELF_HOSTED },
        { property: 'authType', equals: AUTH_TYPES.OAUTH },
      ]
    },
    constraints: {
      notEmpty: VALIDATION_ERROR_MESSAGES.OAUTH_URL_MUST_NOT_BE_EMPTY
    }
  },
  { key: 'audience',
    type: 'text',
    label: LABELS.OAUTH_AUDIENCE,
    condition: {
      allMatch: [
        { property: 'targetType', equals: TARGET_TYPES.SELF_HOSTED },
        { property: 'authType', equals: AUTH_TYPES.OAUTH },
      ]
    },
    constraints: {
      notEmpty: VALIDATION_ERROR_MESSAGES.AUDIENCE_MUST_NOT_BE_EMPTY
    }
  },
  { key: 'scope',
    type: 'text',
    label: LABELS.OAUTH_SCOPE,
    condition: {
      allMatch: [
        { property: 'targetType', equals: TARGET_TYPES.SELF_HOSTED },
        { property: 'authType', equals: AUTH_TYPES.OAUTH },
      ]
    }
  },

  { key: 'oidcURL',
    type: 'text',
    label: 'OIDC Provider URL',
    hint: 'OIDC provider URL that will be opened in browser',
    condition: {
      allMatch: [
        { property: 'targetType', equals: TARGET_TYPES.SELF_HOSTED },
        { property: 'authType', equals: 'oidc' },
      ]
    },
    constraints: {
      notEmpty: 'OIDC Provider URL must not be empty.'
    }
  }
];

export function generateNewElement(elementCount = 0) {
  const defaults = properties
    .reduce((acc, property) => {
      if (property.default !== undefined) {
        acc[property.key] = property.default;
      }
      return acc;
    }, {});

  return { id: generateId(), name: `New connection ${elementCount + 1}`, ...defaults };
}
