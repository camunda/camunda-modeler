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

/**
 * Registers plugin settings and migrates legacy configs
 */
export async function initializeSettings({ settings, getConfig, log }) {
  settings.register(pluginSettings);

  const c8connections = settings.get('connectionManagerPlugin.c8connections');
  if (!c8connections) {
    log('No connections configured, importing legacy');
    const zeebeEndpoints = await getConfig('zeebeEndpoints');
    if (!zeebeEndpoints) {

      settings.set({ 'connectionManagerPlugin.c8connections': [ DEFAULT_ENDPOINT ] });
      return;
    }

    settings.set({ 'connectionManagerPlugin.c8connections':  zeebeEndpoints.map(endpoint=>({
      ...endpoint,
      name: 'Existing connection'
    }))
    });
  }
}

/** @type import('../deployment-plugin/types').Connection */
const DEFAULT_ENDPOINT = {
  id: generateId(),
  name: 'c8run (local)',
  contactPoint: 'grpc://localhost:26500',
  targetType: TARGET_TYPES.SELF_HOSTED,
  authType: AUTH_TYPES.NONE,
};

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
  CONTACT_POINT: 'Cluster endpoint',
  OAUTH_AUDIENCE: 'OAuth audience',
  OAUTH_SCOPE: 'OAuth scope',
  OAUTH_URL: 'OAuth token URL',
  SELF_HOSTED: 'Camunda 8 Self-Managed',
  TARGET: 'Target',
  TENANT_ID: 'Tenant ID'
};

const HINTS = {
  CONTACT_POINT: 'http://localhost:26500',
  TENANT_ID: 'Optional'
};

const VALIDATION_ERROR_MESSAGES = {
  AUDIENCE_MUST_NOT_BE_EMPTY: 'Audience must not be empty.',
  BASIC_AUTH_PASSWORD_MUST_NOT_BE_EMPTY: 'Password must not be empty.',
  BASIC_AUTH_USERNAME_MUST_NOT_BE_EMPTY: 'Username must not be empty.',
  CLIENT_ID_MUST_NOT_BE_EMPTY: 'Client ID must not be empty.',
  CLIENT_SECRET_MUST_NOT_BE_EMPTY: 'Client Secret must not be empty.',
  CLUSTER_URL_MUST_BE_VALID_CLOUD_URL: 'Must be a valid Camunda 8 SaaS URL.',
  CONTACT_POINT_MUST_BE_URL: 'Cluster endpoint must be a valid URL.',
  CONTACT_POINT_MUST_NOT_BE_EMPTY: 'Cluster endpoint must not be empty.',
  CLUSTER_URL_MUST_NOT_BE_EMPTY: 'Cluster URL must not be empty.',
  CONTACT_POINT_MUST_START_WITH_PROTOCOL: 'Cluster endpoint must start with "http://", "grpc://", "https://", or "grpcs", .',
  MUST_PROVIDE_A_VALUE: 'Must provide a value.',
  OAUTH_URL_MUST_NOT_BE_EMPTY: 'OAuth URL must not be empty.'
};

/** @type import("../../../app/Settings").SettingsGroup */
const pluginSettings = {
  id: 'connectionManagerPlugin',
  title: 'Connections',
  order: 1,
  properties: {
    'connectionManagerPlugin.c8connections': {
      type: 'expandableTable',
      label: 'Camunda 8',
      description: 'Manage Camunda 8 orchestration cluster connections.',
      constraints:{
        custom: (zeebeAPI)=> (values, something) => {console.log({ zeebeAPI, values, something }); return null; }
      },
      formConfig: {
        emptyPlaceholder: 'No connections',
        addLabel: 'Add Connection'
      },

      rowProperties: {
        name: {
          type: 'text',
          hint: 'Name',
          default: 'New Connection'
        },
      },

      childProperties: {

        targetType: {
          type: 'radio',
          label: LABELS.TARGET,
          options: [
            { value: TARGET_TYPES.CAMUNDA_CLOUD, label: LABELS.CAMUNDA_CLOUD },
            { value: TARGET_TYPES.SELF_HOSTED, label: LABELS.SELF_HOSTED }
          ],
          default: TARGET_TYPES.CAMUNDA_CLOUD
        },


        camundaCloudClusterUrl: {
          type: 'text',
          label: LABELS.CLUSTER_URL,
          condition: { property: 'targetType', equals: TARGET_TYPES.CAMUNDA_CLOUD },
          constraints: {
            notEmpty: VALIDATION_ERROR_MESSAGES.CLUSTER_URL_MUST_NOT_BE_EMPTY,
            pattern: {
              value: /^((https|grpcs):\/\/|)[a-z\d-]+\.[a-z]+-\d+\.zeebe\.camunda\.io(:443|)\/?/,
              message: VALIDATION_ERROR_MESSAGES.CLUSTER_URL_MUST_BE_VALID_CLOUD_URL
            }
          }
        },
        camundaCloudClientId: {
          type: 'text',
          label: LABELS.CLIENT_ID,
          condition: { property: 'targetType', equals: TARGET_TYPES.CAMUNDA_CLOUD },
          constraints: {
            notEmpty: VALIDATION_ERROR_MESSAGES.CLIENT_ID_MUST_NOT_BE_EMPTY
          }
        },
        camundaCloudClientSecret: {
          type: 'password',
          label: LABELS.CLIENT_SECRET,
          condition: { property: 'targetType', equals: TARGET_TYPES.CAMUNDA_CLOUD },
          constraints: {
            notEmpty: VALIDATION_ERROR_MESSAGES.CLIENT_SECRET_MUST_NOT_BE_EMPTY
          }
        },

        contactPoint: {
          type: 'text',
          label: LABELS.CONTACT_POINT,
          condition: { property: 'targetType', equals: TARGET_TYPES.SELF_HOSTED },
          constraints: {
            notEmpty: VALIDATION_ERROR_MESSAGES.CONTACT_POINT_MUST_NOT_BE_EMPTY,
            pattern: {
              value: /^(http|grpc)s?:\/\//,
              message: VALIDATION_ERROR_MESSAGES.CONTACT_POINT_MUST_BE_URL
            }
          }
        },

        tenantId: {
          type: 'text',
          label: LABELS.TENANT_ID,
          hint: HINTS.TENANT_ID,
          condition: { property: 'targetType', equals: TARGET_TYPES.SELF_HOSTED },
        },

        authType: {
          type: 'radio',
          label: LABELS.AUTHENTICATION,
          options: [
            { value: AUTH_TYPES.NONE, label: LABELS.AUTH_TYPE_NONE },
            { value: AUTH_TYPES.BASIC, label: LABELS.AUTH_TYPE_BASIC_AUTH },
            { value: AUTH_TYPES.OAUTH, label: LABELS.AUTH_TYPE_OAUTH }
          ],
          default: AUTH_TYPES.NONE,
          condition: { property: 'targetType', equals: TARGET_TYPES.SELF_HOSTED }
        },

        basicAuthUsername: {
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
        basicAuthPassword: {
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

        clientId:{
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
        clientSecret:{
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
        oauthURL:{
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
        audience:{
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
        scope:{
          type: 'text',
          label: LABELS.OAUTH_SCOPE,
          condition: {
            allMatch: [
              { property: 'targetType', equals: TARGET_TYPES.SELF_HOSTED },
              { property: 'authType', equals: AUTH_TYPES.OAUTH },
            ]
          }
        }
      }
    }
  }
};