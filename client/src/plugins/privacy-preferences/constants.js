/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { utmTag } from '../../util/utmTag';


export const PRIVACY_TEXT_FIELD = 'To enhance user experience, Camunda Modeler can integrate with 3rd party services, which requires external network requests. Please choose from the settings below.';

export const PRIVACY_POLICY_URL = utmTag('https://camunda.com/legal/privacy/');

export const LEARN_MORE_TEXT = 'With any of these options, none of your personal information or stored data will be submitted. Learn more:';

export const PRIVACY_POLICY_TEXT = 'Camunda Privacy Policy';

export const OK_BUTTON_TEXT = 'Save';

export const CANCEL_BUTTON_TEXT = 'Cancel';

export const TITLE = 'Privacy Preferences';

export const DEFAULT_VALUES = {
  ENABLE_CRASH_REPORTS: true,
  ENABLE_USAGE_STATISTICS: true,
  ENABLE_UPDATE_CHECKS: true
};

export const PREFERENCES_LIST = [
  {
    title: 'Enable Error Reports',
    explanation: 'Allow Camunda Modeler to send error reports containing stack traces and unhandled exceptions.',
    key: 'ENABLE_CRASH_REPORTS'
  },
  {
    title: 'Enable Usage Statistics',
    explanation: 'Allow Camunda Modeler to send pseudonymised usage statistics.',
    key: 'ENABLE_USAGE_STATISTICS'
  },
  {
    title: 'Enable Update Checks',
    explanation: 'Allow Camunda Modeler to periodically check for new updates.',
    key: 'ENABLE_UPDATE_CHECKS'
  }
];
