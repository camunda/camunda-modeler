/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import BpmnLinter from '../../BpmnLinter';

import {
  expectNotSupported as expectNotSupportedFactory,
  expectSupported as expectSupportedFactory,
  parseDefinitions,
  withEventDefinition,
  withLoopCharacteristics
} from './Util';

import camundaCloud11 from '../camundaCloud11';

import camundaCloud11AllXML from './camunda-cloud-1-1-all.bpmn';
import camundaCloud11ErrorXML from './camunda-cloud-1-1-error.bpmn';

const expectNotSupported = expectNotSupportedFactory(camundaCloud11),
      expectSupported = expectSupportedFactory(camundaCloud11);


describe('Camunda Cloud 1.1 BPMN Linting Rules', function() {

  it('should support all BPMN elements', async function() {

    // when
    const definitions = await parseDefinitions(camundaCloud11AllXML);

    const results = await BpmnLinter.lint(definitions);

    // then
    expect(results).to.exist;
    expect(results).to.be.empty;
  });


  it('should not support all BPMN elements', async function() {

    // when
    const definitions = await parseDefinitions(camundaCloud11ErrorXML);

    const results = await BpmnLinter.lint(definitions);

    // then
    expect(results).to.exist;
    expect(results).to.have.length(2);
  });


  [
    'bpmn:BusinessRuleTask',
    'bpmn:ManualTask',
    'bpmn:ScriptTask',
    'bpmn:SendTask'
  ].forEach((type) => {

    describe(type, function() {

      it(`should support ${ type }`, expectSupported(type));


      it(`should support ${ type } (bpmn:MultiInstanceLoopCharacteristics)`, expectSupported(withLoopCharacteristics(type, 'bpmn:MultiInstanceLoopCharacteristics')));

    });

  });


  describe('bpmn:IntermediateThrowEvent', function() {

    it('should support bpmn:IntermediateThrowEvent', expectSupported('bpmn:IntermediateThrowEvent'));


    [
      'bpmn:ErrorEventDefinition',
      'bpmn:MessageEventDefinition',
      'bpmn:TimerEventDefinition'
    ].forEach((type) => {

      it(`should not support bpmn:IntermediateThrowEvent (${ type })`, expectNotSupported(withEventDefinition('bpmn:IntermediateThrowEvent', type), `bpmn:IntermediateThrowEvent (${ type })`));

    });

  });

});