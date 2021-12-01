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
  expectSupported as expectSupportedFactory,
  parseDefinitions,
  withEventDefinition
} from './Util';

import camundaCloud12 from '../camundaCloud12';

import camundaCloud12AllXML from './camunda-cloud-1-2-all.bpmn';
import camundaCloud12ErrorXML from './camunda-cloud-1-2-error.bpmn';

const expectSupported = expectSupportedFactory(camundaCloud12);


describe('Camunda Cloud 1.2 BPMN Linting Rules', function() {

  it('should support all BPMN elements', async function() {

    // when
    const definitions = await parseDefinitions(camundaCloud12AllXML);

    const results = await BpmnLinter.lint(definitions);

    // then
    expect(results).to.exist;
    expect(results).to.be.empty;
  });


  it('should not support all BPMN elements', async function() {

    // when
    const definitions = await parseDefinitions(camundaCloud12ErrorXML);

    const results = await BpmnLinter.lint(definitions);

    // then
    expect(results).to.exist;
    expect(results).to.have.length(1);
  });


  describe('bpmn:EndEvent', function() {

    it('should support bpmn:EndEvent (bpmn:MessageEventDefinition)', expectSupported(withEventDefinition('bpmn:EndEvent', 'bpmn:MessageEventDefinition')));

  });


  describe('bpmn:IntermediateThrowEvent', function() {

    it('should support bpmn:IntermediateThrowEvent (bpmn:MessageEventDefinition)', expectSupported(withEventDefinition('bpmn:IntermediateThrowEvent', 'bpmn:MessageEventDefinition')));

  });

});