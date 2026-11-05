/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { registerClientPlugin } from 'camunda-modeler-plugin-helpers';

import {
  EmailFieldModule,
  PercentageFieldModule,
  PhoneFieldModule
} from './fields';

/*
 * A custom form field must be known to both, the form editor
 * and the form preview (viewer).
 *
 * Plug-ins may use <registerFormJSPlugin>, <registerCloudFormJSPlugin> and
 * <registerPlatformFormJSPlugin> once available in camunda-modeler-plugin-helpers.
 */

// Camunda 7 and Camunda 8
registerFormField(EmailFieldModule, 'form.modeler');

// Camunda 7
registerFormField(PhoneFieldModule, 'form.platform.modeler');

// Camunda 8
registerFormField(PercentageFieldModule, 'form.cloud.modeler');


function registerFormField(module, prefix) {
  registerClientPlugin(module, `${ prefix }.editor.additionalModules`);
  registerClientPlugin(module, `${ prefix }.viewer.additionalModules`);
}
