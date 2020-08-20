/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import TestContainer from 'mocha-test-container-support';

import BpmnModeler from '../../../../../app/tabs/bpmn/modeler/BpmnModeler';

import EditorActions from '../../EditorActions';

import diagramXML from './diagram.bpmn';

const DEFAULT_OPTIONS = {
  additionalModules: [
    {
      __init__: [
        'elementTemplatesModalEditorActions',
      ],
      elementTemplatesModalEditorActions: [ 'type', EditorActions ]
    }
  ],
  exporter: {
    name: 'my-tool',
    version: '120-beta.100'
  }
};


describe('EditorActions', function() {

  this.timeout(10000);

  let container,
      modeler;

  beforeEach(async function() {
    container = TestContainer.get(this);

    modeler = await createModeler({
      container
    });
  });


  it('should bootstrap', async function() {

    // then
    expect(modeler).to.exist;
  });


  describe('applyElementTemplate', function() {

    it('should apply element template', function() {

      // given
      const editorActions = modeler.get('editorActions'),
            elementRegistry = modeler.get('elementRegistry'),
            selection = modeler.get('selection');

      const serviceTask = elementRegistry.get('ServiceTask_1');

      selection.select(serviceTask);

      // when
      const applied = editorActions.trigger('applyElementTemplate', DEFAULT_ELEMENT_TEMPLATE);

      // then
      expect(applied).to.be.true;

      expect(serviceTask.businessObject.modelerTemplate).to.equal(DEFAULT_ELEMENT_TEMPLATE.id);
    });


    it('should not apply element template (no element selected)', function() {

      // given
      const editorActions = modeler.get('editorActions');

      // when
      const applied = editorActions.trigger('applyElementTemplate', DEFAULT_ELEMENT_TEMPLATE);

      // then
      expect(applied).to.be.false;
    });

  });


  describe('getSelectedElementType', function() {

    it('should get selected element type', function() {

      // given
      const editorActions = modeler.get('editorActions'),
            elementRegistry = modeler.get('elementRegistry'),
            selection = modeler.get('selection');

      const serviceTask = elementRegistry.get('ServiceTask_1');

      selection.select(serviceTask);

      // when
      const selectedElementType = editorActions.trigger('getSelectedElementType');

      // then
      expect(selectedElementType).to.equal('bpmn:ServiceTask');
    });


    it('should not get selected element type (no element selected)', function() {

      // given
      const editorActions = modeler.get('editorActions');

      // when
      const selectedElementType = editorActions.trigger('getSelectedElementType');

      // then
      expect(selectedElementType).to.be.null;
    });

  });


  describe('getSelectedElementAppliedElementTemplate', function() {

    it('should get selected element type', function() {

      // given
      const editorActions = modeler.get('editorActions'),
            elementRegistry = modeler.get('elementRegistry'),
            selection = modeler.get('selection');

      const serviceTask = elementRegistry.get('ServiceTask_2');

      selection.select(serviceTask);

      // when
      const selectedElementAppliedElementTemplate = editorActions.trigger('getSelectedElementAppliedElementTemplate');

      // then
      expect(selectedElementAppliedElementTemplate).to.equal('some-rpa-template');
    });


    it('should not get selected element type (no element template applied)', function() {

      // given
      const editorActions = modeler.get('editorActions'),
            elementRegistry = modeler.get('elementRegistry'),
            selection = modeler.get('selection');

      const serviceTask = elementRegistry.get('ServiceTask_1');

      selection.select(serviceTask);

      // when
      const selectedElementAppliedElementTemplate = editorActions.trigger('getSelectedElementAppliedElementTemplate');

      // then
      expect(selectedElementAppliedElementTemplate).to.be.null;
    });


    it('should not get selected element type (no element selected)', function() {

      // given
      const editorActions = modeler.get('editorActions');

      // when
      const selectedElementAppliedElementTemplate = editorActions.trigger('getSelectedElementAppliedElementTemplate');

      // then
      expect(selectedElementAppliedElementTemplate).to.be.null;
    });

  });

});

// helpers //////////

const DEFAULT_ELEMENT_TEMPLATE = {
  appliesTo: [
    'bpmn:ServiceTask'
  ],
  id: 'some-rpa-template',
  name: 'Template 1',
  properties: []
};

async function createModeler(options = {}) {
  const modeler = new BpmnModeler({
    ...DEFAULT_OPTIONS,
    ...options
  });

  await modeler.importXML(diagramXML);

  return modeler;
}