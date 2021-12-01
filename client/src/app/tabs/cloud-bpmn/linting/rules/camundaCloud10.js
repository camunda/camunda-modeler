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
  checkSome,
  hasEventDefinitionOfType,
  hasLoopCharacteristicsOfType,
  hasNoEventDefinition,
  hasNoLoopCharacteristics,
  isNotBpmn
} from './Util';

export default [
  {
    check: isNotBpmn
  },
  'bpmn:Association',
  'bpmn:CallActivity',
  'bpmn:Collaboration',
  'bpmn:Definitions',
  'bpmn:EventBasedGateway',
  'bpmn:ExclusiveGateway',
  'bpmn:Group',
  'bpmn:ParallelGateway',
  'bpmn:Participant',
  'bpmn:Process',
  'bpmn:SequenceFlow',
  'bpmn:TextAnnotation',
  {
    type: 'bpmn:BoundaryEvent',
    check: hasEventDefinitionOfType([
      'bpmn:ErrorEventDefinition',
      'bpmn:MessageEventDefinition',
      'bpmn:TimerEventDefinition'
    ])
  },
  {
    type: 'bpmn:EndEvent',
    check: checkSome(
      hasNoEventDefinition,
      hasEventDefinitionOfType([
        'bpmn:ErrorEventDefinition'
      ])
    )
  },
  {
    type: 'bpmn:IntermediateCatchEvent',
    check: hasEventDefinitionOfType([
      'bpmn:MessageEventDefinition',
      'bpmn:TimerEventDefinition'
    ])
  },
  {
    type: 'bpmn:ReceiveTask',
    check: checkSome(
      hasNoLoopCharacteristics,
      hasLoopCharacteristicsOfType('bpmn:MultiInstanceLoopCharacteristics')
    )
  },
  {
    type: 'bpmn:ServiceTask',
    check: checkSome(
      hasNoLoopCharacteristics,
      hasLoopCharacteristicsOfType('bpmn:MultiInstanceLoopCharacteristics')
    )
  },
  {
    type: 'bpmn:StartEvent',
    check: checkSome(
      hasNoEventDefinition,
      hasEventDefinitionOfType([
        'bpmn:ErrorEventDefinition',
        'bpmn:MessageEventDefinition',
        'bpmn:TimerEventDefinition'
      ])
    )
  },
  {
    type: 'bpmn:SubProcess',
    check: hasNoLoopCharacteristics
  },
  {
    type: 'bpmn:UserTask',
    check: checkSome(
      hasNoLoopCharacteristics,
      hasLoopCharacteristicsOfType('bpmn:MultiInstanceLoopCharacteristics')
    )
  }
];