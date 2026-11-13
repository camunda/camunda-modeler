/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import createFieldModule from './createFieldModule';

const TEXT_ENTRIES = [
  'key',
  'label',
  'description',
  'disabled',
  'readonly',
  'required',
  'validationType'
];

const NUMBER_ENTRIES = [
  'key',
  'label',
  'description',
  'disabled',
  'readonly',
  'required'
];

/**
 * Available in Camunda 7 and Camunda 8 forms.
 */
export const EmailFieldModule = createFieldModule({
  id: 'emailField',
  baseType: 'textfield',
  type: 'email',
  name: 'Email field',
  label: 'Email',
  appearance: { prefixAdorner: '@' },
  validate: { validationType: 'email' },
  propertiesPanelEntries: TEXT_ENTRIES
});

/**
 * Available in Camunda 7 forms only.
 */
export const PhoneFieldModule = createFieldModule({
  id: 'phoneField',
  baseType: 'textfield',
  type: 'phone',
  name: 'Phone field',
  label: 'Phone',
  appearance: { prefixAdorner: 'Tel' },
  validate: { validationType: 'phone' },
  propertiesPanelEntries: TEXT_ENTRIES
});

/**
 * Available in Camunda 8 forms only.
 */
export const PercentageFieldModule = createFieldModule({
  id: 'percentageField',
  baseType: 'number',
  type: 'percentage',
  name: 'Percentage field',
  label: 'Percentage',
  appearance: { suffixAdorner: '%' },
  propertiesPanelEntries: NUMBER_ENTRIES
});
