/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { expect } from 'chai';

import {
  getBpmnDefinitions,
  getAllElementsByType
} from '../parse';


const BPMN_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:camunda="http://camunda.org/schema/1.0/bpmn"
                  targetNamespace="http://bpmn.io/schema/bpmn"
                  id="Definitions_1">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" />
    <bpmn:serviceTask id="ServiceTask_1" name="My Service Task" />
    <bpmn:endEvent id="EndEvent_1" />
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="ServiceTask_1" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="ServiceTask_1" targetRef="EndEvent_1" />
  </bpmn:process>
</bpmn:definitions>`;

const CLOUD_BPMN_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:zeebe="http://camunda.org/schema/zeebe/1.0"
                  targetNamespace="http://bpmn.io/schema/bpmn"
                  id="Definitions_1">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" />
    <bpmn:endEvent id="EndEvent_1" />
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="EndEvent_1" />
  </bpmn:process>
</bpmn:definitions>`;


describe('util/parse', function() {

  describe('getBpmnDefinitions', function() {

    it('should parse bpmn diagram', async function() {

      // when
      const definitions = await getBpmnDefinitions(BPMN_XML, 'bpmn');

      // then
      expect(definitions).to.exist;
      expect(definitions.$type).to.equal('bpmn:Definitions');
    });


    it('should parse cloud-bpmn diagram', async function() {

      // when
      const definitions = await getBpmnDefinitions(CLOUD_BPMN_XML, 'cloud-bpmn');

      // then
      expect(definitions).to.exist;
      expect(definitions.$type).to.equal('bpmn:Definitions');
    });

  });


  describe('getAllElementsByType', function() {

    it('should return elements of given type', async function() {

      // when
      const elements = await getAllElementsByType(BPMN_XML, 'bpmn:ServiceTask', 'bpmn');

      // then
      expect(elements).to.have.length(1);
      expect(elements[0].id).to.equal('ServiceTask_1');
    });


    it('should return empty array if no elements of type', async function() {

      // when
      const elements = await getAllElementsByType(BPMN_XML, 'bpmn:UserTask', 'bpmn');

      // then
      expect(elements).to.be.empty;
    });

  });

});
