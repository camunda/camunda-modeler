/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import camundaCloud10 from './camundaCloud10';

import {
  checkSome,
  hasLoopCharacteristicsOfType,
  hasNoEventDefinition,
  hasNoLoopCharacteristics
} from './Util';

export default [
  ...camundaCloud10,
  {
    type: 'bpmn:BusinessRuleTask',
    check: checkSome(
      hasNoLoopCharacteristics,
      hasLoopCharacteristicsOfType('bpmn:MultiInstanceLoopCharacteristics')
    )
  },
  {
    type: 'bpmn:IntermediateThrowEvent',
    check: hasNoEventDefinition
  },
  {
    type: 'bpmn:ManualTask',
    check: checkSome(
      hasNoLoopCharacteristics,
      hasLoopCharacteristicsOfType('bpmn:MultiInstanceLoopCharacteristics')
    )
  },
  {
    type: 'bpmn:ScriptTask',
    check: checkSome(
      hasNoLoopCharacteristics,
      hasLoopCharacteristicsOfType('bpmn:MultiInstanceLoopCharacteristics')
    )
  },
  {
    type: 'bpmn:SendTask',
    check: checkSome(
      hasNoLoopCharacteristics,
      hasLoopCharacteristicsOfType('bpmn:MultiInstanceLoopCharacteristics')
    )
  }
];