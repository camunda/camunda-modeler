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

import camundaCloud10 from '../camundaCloud10';

import camundaCloud10AllXML from './camunda-cloud-1-0-all.bpmn';
import camundaCloud10ErrorXML from './camunda-cloud-1-0-error.bpmn';

const expectNotSupported = expectNotSupportedFactory(camundaCloud10),
      expectSupported = expectSupportedFactory(camundaCloud10);


describe('Camunda Cloud 1.0 BPMN Linting Rules', function() {

  it('should support all BPMN elements', async function() {

    // when
    const definitions = await parseDefinitions(camundaCloud10AllXML);

    const results = await BpmnLinter.lint(definitions);

    // then
    expect(results).to.exist;
    expect(results).to.be.empty;
  });


  it('should not support all BPMN elements', async function() {

    // when
    const definitions = await parseDefinitions(camundaCloud10ErrorXML);

    const results = await BpmnLinter.lint(definitions);

    // then
    expect(results).to.exist;
    expect(results).to.have.length(5);
  });


  describe('bpmndi', function() {

    it('should support bpmndi:BPMNDiagram', expectSupported('bpmndi:BPMNDiagram'));


    it('should support bpmndi:BPMNPlane', expectSupported('bpmndi:BPMNPlane'));


    it('should support bpmndi:BPMNShape', expectSupported('bpmndi:BPMNShape'));


    it('should support bpmndi:BPMNEdge', expectSupported('bpmndi:BPMNEdge'));

  });


  describe('dc', function() {

    it('should support dc:Bounds', expectSupported('dc:Bounds'));


    it('should support dc:Point', expectSupported('dc:Point'));

  });


  [
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
    'bpmn:TextAnnotation'
  ].forEach((type) => {

    it(`should support ${ type }`, expectSupported(type));

  });


  describe('bpmn:BoundaryEvent', function() {

    [
      'bpmn:ErrorEventDefinition',
      'bpmn:MessageEventDefinition',
      'bpmn:TimerEventDefinition'
    ].forEach((type) => {

      it(`should support bpmn:BoundaryEvent (${ type })`, expectSupported(withEventDefinition('bpmn:BoundaryEvent', type)));

    });

  });


  describe('bpmn:EndEvent', function() {

    it('should support bpmn:EndEvent', expectSupported('bpmn:EndEvent'));


    it('should support bpmn:EndEvent (bpmn:ErrorEventDefinition)', expectSupported(withEventDefinition('bpmn:EndEvent', 'bpmn:ErrorEventDefinition')));


    [
      'bpmn:MessageEventDefinition',
      'bpmn:TimerEventDefinition'
    ].forEach((type) => {

      it(`should not support bpmn:EndEvent (${ type })`, expectNotSupported(withEventDefinition('bpmn:EndEvent', type), `bpmn:EndEvent (${ type })`));

    });

  });


  describe('bpmn:IntermediateCatchEvent', function() {

    it('should not support bpmn:IntermediateCatchEvent', expectNotSupported('bpmn:IntermediateCatchEvent'));


    [
      'bpmn:MessageEventDefinition',
      'bpmn:TimerEventDefinition'
    ].forEach((type) => {

      it(`should not support bpmn:IntermediateCatchEvent (${ type })`, expectSupported(withEventDefinition('bpmn:IntermediateCatchEvent', type)));

    });


    it(
      'should not support bpmn:IntermediateCatchEvent (bpmn:ErrorEventDefinition)',
      expectNotSupported(
        withEventDefinition('bpmn:IntermediateCatchEvent', 'bpmn:ErrorEventDefinition'),
        'bpmn:IntermediateCatchEvent (bpmn:ErrorEventDefinition)'
      )
    );

  });


  [
    'bpmn:ReceiveTask',
    'bpmn:ServiceTask',
    'bpmn:UserTask'
  ].forEach((type) => {

    describe(type, function() {

      it(`should support ${ type }`, expectSupported(type));


      it(`should support ${ type } (bpmn:MultiInstanceLoopCharacteristics)`, expectSupported(withLoopCharacteristics(type, 'bpmn:MultiInstanceLoopCharacteristics')));

    });

  });


  describe('bpmn:SubProcess', function() {

    it('should support bpmn:SubProcess', expectSupported('bpmn:SubProcess'));


    it(
      'should not support bpmn:SubProcess (bpmn:MultiInstanceLoopCharacteristics)',
      expectNotSupported(
        withLoopCharacteristics('bpmn:SubProcess', 'bpmn:MultiInstanceLoopCharacteristics'),
        'bpmn:SubProcess (bpmn:MultiInstanceLoopCharacteristics)'
      )
    );

  });


  describe('bpmn:StartEvent', function() {

    it('should not support bpmn:StartEvent', expectSupported('bpmn:StartEvent'));


    [
      'bpmn:ErrorEventDefinition',
      'bpmn:MessageEventDefinition',
      'bpmn:TimerEventDefinition'
    ].forEach((type) => {

      it(`should support bpmn:StartEvent (${ type })`, expectSupported(withEventDefinition('bpmn:StartEvent', type)));

    });

  });

});