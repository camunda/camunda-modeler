/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { shapeCreateRule } from '../AppendToExpandedSubprocess';


describe('AppendToExpandedSubprocess - shapeCreateRule', function() {

  describe('should allow', function() {

    it('task dropped into expanded sub-process (source === target)', function() {

      // given
      const subProcess = createExpandedSubProcess();
      const taskShape = createFlowElement('bpmn:Task');

      // when
      const result = shapeCreateRule({
        shape: taskShape,
        source: subProcess,
        target: subProcess,
        position: { x: 10, y: 10 }
      });

      // then
      expect(result).to.be.true;
    });


    it('end event dropped into expanded sub-process', function() {

      // given
      const subProcess = createExpandedSubProcess();
      const endEventShape = createFlowElement('bpmn:EndEvent');

      // when
      const result = shapeCreateRule({
        shape: endEventShape,
        source: subProcess,
        target: subProcess,
        position: { x: 10, y: 10 }
      });

      // then
      expect(result).to.be.true;
    });


    it('gateway dropped into expanded sub-process', function() {

      // given
      const subProcess = createExpandedSubProcess();
      const gatewayShape = createFlowElement('bpmn:ExclusiveGateway');

      // when
      const result = shapeCreateRule({
        shape: gatewayShape,
        source: subProcess,
        target: subProcess,
        position: { x: 10, y: 10 }
      });

      // then
      expect(result).to.be.true;
    });

  });


  describe('should NOT interfere', function() {

    it('when source !== target', function() {

      // given
      const subProcessA = createExpandedSubProcess();
      const subProcessB = createExpandedSubProcess();
      const taskShape = createFlowElement('bpmn:Task');

      // when
      const result = shapeCreateRule({
        shape: taskShape,
        source: subProcessA,
        target: subProcessB,
        position: { x: 10, y: 10 }
      });

      // then - does not intercept; falls through to default rules
      expect(result).to.be.undefined;
    });


    it('when source is null', function() {

      // given
      const subProcess = createExpandedSubProcess();
      const taskShape = createFlowElement('bpmn:Task');

      // when
      const result = shapeCreateRule({
        shape: taskShape,
        source: null,
        target: subProcess,
        position: { x: 10, y: 10 }
      });

      // then
      expect(result).to.be.undefined;
    });


    it('when target is a collapsed sub-process', function() {

      // given
      const collapsedSubProcess = createCollapsedSubProcess();
      const taskShape = createFlowElement('bpmn:Task');

      // when
      const result = shapeCreateRule({
        shape: taskShape,
        source: collapsedSubProcess,
        target: collapsedSubProcess,
        position: { x: 10, y: 10 }
      });

      // then - collapsed sub-processes use standard append behavior
      expect(result).to.be.undefined;
    });


    it('when target is not a sub-process', function() {

      // given
      const task = createFlowElement('bpmn:Task');
      const shape = createFlowElement('bpmn:Task');

      // when
      const result = shapeCreateRule({
        shape,
        source: task,
        target: task,
        position: { x: 10, y: 10 }
      });

      // then - only handles sub-processes
      expect(result).to.be.undefined;
    });


    it('when shape is a data store reference', function() {

      // given
      const subProcess = createExpandedSubProcess();
      const dataStoreShape = createDataStoreReference();

      // when
      const result = shapeCreateRule({
        shape: dataStoreShape,
        source: subProcess,
        target: subProcess,
        position: { x: 10, y: 10 }
      });

      // then - data store references are not placed inside sub-processes
      expect(result).to.be.undefined;
    });

  });

});


// helpers //////////

/**
 * Create a mock element that satisfies the `is()` and `isExpanded()` checks
 * for an expanded bpmn:SubProcess.
 */
function createExpandedSubProcess() {

  // `isExpanded` calls `getDi(element)` → `element.di`
  // then checks `is(di, 'bpmndi:BPMNPlane')` and `di.isExpanded`
  const di = {
    $instanceOf: (type) => type === 'bpmndi:BPMNShape',
    isExpanded: true
  };

  return {
    businessObject: {
      $instanceOf: (type) => [
        'bpmn:SubProcess',
        'bpmn:FlowElementsContainer',
        'bpmn:FlowNode',
        'bpmn:FlowElement',
        'bpmn:Activity',
        'bpmn:BaseElement'
      ].includes(type)
    },
    di
  };
}

/**
 * Create a mock element that satisfies the `is()` and `isExpanded()` checks
 * for a collapsed bpmn:SubProcess.
 */
function createCollapsedSubProcess() {
  const di = {
    $instanceOf: (type) => type === 'bpmndi:BPMNShape',
    isExpanded: false
  };

  return {
    businessObject: {
      $instanceOf: (type) => [
        'bpmn:SubProcess',
        'bpmn:FlowElementsContainer',
        'bpmn:FlowNode',
        'bpmn:FlowElement',
        'bpmn:Activity',
        'bpmn:BaseElement'
      ].includes(type)
    },
    di
  };
}

/**
 * Create a mock element for a bpmn:FlowElement (task, event, gateway, etc.).
 *
 * @param {string} type - concrete BPMN type, e.g. 'bpmn:Task'
 */
function createFlowElement(type) {
  return {
    businessObject: {
      $instanceOf: (t) => {
        if (t === type) { return true; }
        if (t === 'bpmn:FlowElement') { return true; }
        if (t === 'bpmn:DataStoreReference') { return false; }
        return false;
      }
    }
  };
}

/**
 * Create a mock data store reference.
 */
function createDataStoreReference() {
  return {
    businessObject: {
      $instanceOf: (t) => [
        'bpmn:DataStoreReference',
        'bpmn:FlowElement',
        'bpmn:ItemAwareElement',
        'bpmn:BaseElement'
      ].includes(t)
    }
  };
}
