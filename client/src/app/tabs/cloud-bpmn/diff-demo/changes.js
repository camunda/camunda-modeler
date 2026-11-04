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
  restoreDocumentation,
  restoreExtensionProperty,
  restoreIoParameter,
  restoreIoParameterProperty,
  restoreName
} from './restore';

/**
 * @typedef { {
 *   entry: string,
 *   group: string,
 *   type: 'added'|'changed'|'removed',
 *   oldValue?: string,
 *   label: string,
 *   ghost?: string,
 *   restore?: (injector: Object, element: Object) => void
 * } } Change
 */

/**
 * Labels of the properties panel groups (sections) referenced below.
 */
export const GROUP_LABELS = {
  general: 'General',
  documentation: 'Documentation',
  taskDefinition: 'Task definition',
  inputs: 'Inputs',
  outputs: 'Outputs',
  headers: 'Headers'
};

/**
 * PROTOTYPE: hard-coded changes between the original and the modified
 * diagram, keyed by element ID. `entry` is the properties panel entry ID,
 * `group` the ID of the group (section) containing it. `oldValue` enables
 * an inline diff for changed entries.
 *
 * Removed list items are not rendered anymore; `ghost` (the item label)
 * renders a placeholder item in the group instead.
 *
 * @type {Object<string, Array<Change>>}
 */
export default {
  Task_PrepareOrder: [
    {
      group: 'general',
      entry: 'name',
      label: 'Name',
      type: 'changed',
      oldValue: 'Prepare order data',
      restore: restoreName('Prepare order data')
    },
    {
      group: 'documentation',
      entry: 'documentation',
      label: 'Element documentation',
      type: 'changed',
      oldValue: 'This service tasks prepares some data',
      restore: restoreDocumentation('This service tasks prepares some data')
    },
    {
      group: 'taskDefinition',
      entry: 'taskDefinitionType',
      label: 'Job type',
      type: 'changed',
      oldValue: 'prepare-order-data',
      restore: restoreExtensionProperty('zeebe:TaskDefinition', 'type', 'prepare-order-data')
    },
    { group: 'taskDefinition', entry: 'taskDefinitionRetries', label: 'Retries', type: 'added' },
    {
      group: 'inputs',
      type: 'removed',
      ghost: 'foo',
      label: 'Input: foo',
      restore: restoreIoParameter('inputParameters', 'zeebe:Input', { source: '=bar', target: 'foo' })
    },
    {
      group: 'outputs',
      entry: 'Task_PrepareOrder-output-0-source',
      label: 'Output: customer',
      type: 'changed',
      oldValue: '{ name: "Ada", tier: "gold", active: true }',
      restore: restoreIoParameterProperty('outputParameters', 0, 'source', '={ name: "Ada", tier: "gold", active: true }')
    },
    { group: 'outputs', entry: 'Task_PrepareOrder-output-2', label: 'Output: preparedAt', type: 'added' },
    {
      group: 'outputs',
      type: 'removed',
      ghost: 'serviceConfig',
      label: 'Output: serviceConfig',
      restore: restoreIoParameter('outputParameters', 'zeebe:Output', {
        source: '={ host: "api.example.com", port: 443 }',
        target: 'serviceConfig'
      })
    },
    { group: 'headers', entry: 'Task_PrepareOrder-header-0', label: 'Header: priority', type: 'added' }
  ]
};
