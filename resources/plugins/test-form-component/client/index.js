/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import {
  registerCloudFormJSPlugin,
  registerFormJSPlugin,
  registerPlatformFormJSPlugin
} from 'camunda-modeler-plugin-helpers';

import {
  EmailFieldModule,
  PercentageFieldModule,
  PhoneFieldModule
} from './fields';

/*
 * A custom form field must be known to both, the form editor
 * and the form preview (viewer), which is the default of the helpers.
 */

// Camunda 7 and Camunda 8
registerFormJSPlugin(EmailFieldModule);

// Camunda 7
registerPlatformFormJSPlugin(PhoneFieldModule);

// Camunda 8
registerCloudFormJSPlugin(PercentageFieldModule);
