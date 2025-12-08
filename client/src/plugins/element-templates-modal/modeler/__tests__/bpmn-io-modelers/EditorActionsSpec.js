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
import collaborationXML from './collaboration.bpmn';

import templatesJSON from './templates.json';

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
  },
  changeTemplateCommand: 'propertiesPanel.camunda.changeTemplate',
  settings: {
    get: () => false,
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

    it('should apply element template to task', function() {

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


    it('should apply element template to process', function() {

      // given
      const editorActions = modeler.get('editorActions'),
            elementRegistry = modeler.get('elementRegistry');

      const process = elementRegistry.get('Process_1');

      // when
      const applied = editorActions.trigger('applyElementTemplate', DEFAULT_ELEMENT_TEMPLATE);

      // then
      expect(applied).to.be.true;

      expect(process.businessObject.modelerTemplate).to.equal(DEFAULT_ELEMENT_TEMPLATE.id);
    });


    it('should not apply element template given a multi-selection', function() {

      // given
      const editorActions = modeler.get('editorActions'),
            elementRegistry = modeler.get('elementRegistry'),
            selection = modeler.get('selection');

      const serviceTask = elementRegistry.get('ServiceTask_1'),
            process = elementRegistry.get('Process_1');

      selection.select([ serviceTask, process ]);

      // when
      const applied = editorActions.trigger('applyElementTemplate', DEFAULT_ELEMENT_TEMPLATE);

      // then
      expect(applied).to.be.false;
    });

  });


  describe('getElementTemplates', function() {

    it('should return empty array if no templates are set', function() {

      // given
      const editorActions = modeler.get('editorActions');

      // when
      const templates = editorActions.trigger('getElementTemplates');

      // then
      expect(templates).to.exist;
      expect(templates).to.be.empty;
    });


    it('should return latest element templates', function() {

      // given
      const editorActions = modeler.get('editorActions');
      const elementTemplatesLoader = modeler.get('elementTemplatesLoader');
      elementTemplatesLoader.setTemplates(templatesJSON);

      // when
      const elementTemplates = editorActions.trigger('getElementTemplates');

      // then
      expect(elementTemplates).to.exist;

      // exclude deprecated
      // exclude old versions
      expect(elementTemplates).to.have.length(5);
    });


    it('should return only applicable templates for element', function() {

      // given
      const editorActions = modeler.get('editorActions');
      const elementTemplatesLoader = modeler.get('elementTemplatesLoader');
      elementTemplatesLoader.setTemplates(templatesJSON);

      const elementRegistry = modeler.get('elementRegistry');
      const serviceTask = elementRegistry.get('ServiceTask_1');

      // when
      const elementTemplates = editorActions.trigger('getElementTemplates', { element: serviceTask });

      // then
      expect(elementTemplates).to.exist;
      expect(elementTemplates).to.have.length(3);
    });

  });


  describe('getSelectedElement', function() {

    it('should get selected element', function() {

      // given
      const editorActions = modeler.get('editorActions'),
            elementRegistry = modeler.get('elementRegistry'),
            selection = modeler.get('selection');

      const serviceTask = elementRegistry.get('ServiceTask_1');

      selection.select(serviceTask);

      // when
      const selectedElement = editorActions.trigger('getSelectedElement');

      // then
      expect(selectedElement).to.exist;
      expect(selectedElement.businessObject.$type).to.equal('bpmn:ServiceTask');
    });


    it('should get root element (bpmn:Process) given no element is selected', function() {

      // given
      const editorActions = modeler.get('editorActions');

      // when
      const selectedElement = editorActions.trigger('getSelectedElement');

      // then
      expect(selectedElement).to.exist;
      expect(selectedElement.businessObject.$type).to.equal('bpmn:Process');
    });


    it('should get root element (bpmn:Collaboration) given no element is selected', async function() {

      // given
      container = TestContainer.get(this);

      modeler = await createModeler({
        container
      }, collaborationXML);

      const editorActions = modeler.get('editorActions');

      // when
      const selectedElement = editorActions.trigger('getSelectedElement');

      // then
      expect(selectedElement).to.exist;
      expect(selectedElement.businessObject.$type).to.equal('bpmn:Collaboration');
    });


    it('should return null given multiple elements are selected', function() {

      // given
      const editorActions = modeler.get('editorActions'),
            elementRegistry = modeler.get('elementRegistry'),
            selection = modeler.get('selection');

      const serviceTask1 = elementRegistry.get('ServiceTask_1'),
            serviceTask2 = elementRegistry.get('ServiceTask_2');

      selection.select([ serviceTask1, serviceTask2 ]);

      // when
      const selectedElement = editorActions.trigger('getSelectedElement');

      // then
      expect(selectedElement).to.be.null;
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


    it('should not get selected element type (multiple elements selected)', function() {

      // given
      const editorActions = modeler.get('editorActions'),
            elementRegistry = modeler.get('elementRegistry'),
            selection = modeler.get('selection');

      const serviceTask1 = elementRegistry.get('ServiceTask_1'),
            serviceTask2 = elementRegistry.get('ServiceTask_2');

      selection.select([ serviceTask1, serviceTask2 ]);

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
    'bpmn:ServiceTask',
    'bpmn:Process'
  ],
  id: 'some-rpa-template',
  name: 'Template 1',
  properties: []
};

async function createModeler(options = {}, diagram = diagramXML) {
  const modeler = new BpmnModeler({
    ...DEFAULT_OPTIONS,
    ...options
  });

  await modeler.importXML(diagram);

  return modeler;
}
