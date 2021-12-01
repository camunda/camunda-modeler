/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import camundaCloud11 from './camundaCloud11';

import { hasEventDefinitionOfType } from './Util';

export default [
  ...camundaCloud11,
  {
    type: 'bpmn:EndEvent',
    check: hasEventDefinitionOfType([
      'bpmn:MessageEventDefinition'
    ])
  },
  {
    type: 'bpmn:IntermediateThrowEvent',
    check: hasEventDefinitionOfType([
      'bpmn:MessageEventDefinition'
    ])
  }
];