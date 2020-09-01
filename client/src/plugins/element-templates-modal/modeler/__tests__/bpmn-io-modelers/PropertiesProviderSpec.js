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

import PropertiesProvider from '../../PropertiesProvider';

import diagramXML from './diagram.bpmn';

const DEFAULT_OPTIONS = {
  additionalModules: [
    {
      __init__: [
        'propertiesProvider',
      ],
      propertiesProvider: [ 'type', PropertiesProvider ]
    }
  ],
  exporter: {
    name: 'my-tool',
    version: '120-beta.100'
  },
  propertiesProvider: {
    openElementTemplatesModal() {}
  }
};


describe('PropertiesProvider', function() {

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


  it('should add entry', function() {

    // given
    const elementRegistry = modeler.get('elementRegistry'),
          elementTemplatesLoader = modeler.get('elementTemplatesLoader'),
          propertiesPanel = modeler.get('propertiesPanel');

    elementTemplatesLoader.setTemplates(DEFAULT_ELEMENT_TEMPLATES);

    const serviceTask = elementRegistry.get('ServiceTask_1');

    // when
    const tabs = propertiesPanel._propertiesProvider.getTabs(serviceTask);

    // then
    const generalTab = tabs.find(({ id }) => id === 'general');

    expect(generalTab).to.exist;

    const { groups } = generalTab;

    const generalGroup = groups.find(({ id }) => id === 'general');

    expect(generalGroup).to.exist;

    const { entries } = generalGroup;

    const entry = entries.find(({ id }) => id === 'elementTemplatesModal');

    expect(entry).to.exist;
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

const DEFAULT_ELEMENT_TEMPLATES = [ DEFAULT_ELEMENT_TEMPLATE ];

async function createModeler(options = {}) {
  const modeler = new BpmnModeler({
    ...DEFAULT_OPTIONS,
    ...options
  });

  await modeler.importXML(diagramXML);

  return modeler;
}