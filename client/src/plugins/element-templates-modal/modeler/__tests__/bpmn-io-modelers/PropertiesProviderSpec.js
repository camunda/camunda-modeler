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

import Flags from '../../../../../util/Flags';

import PropertiesProvider from '../../PropertiesProvider';

import diagramXML from './diagram.bpmn';

/* global sinon */

const DEFAULT_ELEMENT_TEMPLATE = {
  appliesTo: [
    'bpmn:Process'
  ],
  id: 'some-rpa-template',
  name: 'Template 1',
  properties: []
};

const DEFAULT_ELEMENT_TEMPLATES = [ DEFAULT_ELEMENT_TEMPLATE ];

const DEFAULT_OPTIONS = {
  additionalModules: [
    {
      __init__: [
        'templatesPropertiesProvider',
      ],
      templatesPropertiesProvider: [ 'type', PropertiesProvider ]
    }
  ],
  exporter: {
    name: 'my-tool',
    version: '120-beta.100'
  },
  propertiesProvider: {
    openElementTemplatesModal() {}
  },
  elementTemplates: DEFAULT_ELEMENT_TEMPLATES
};


describe('PropertiesProvider', function() {

  let container;

  beforeEach(function() {
    container = TestContainer.get(this);
  });

  afterEach(function() {
    Flags.reset();
  });


  it('should open modal when "select" button is clicked', async function() {

    // given
    const spy = sinon.spy();
    await createModeler({
      container,
      propertiesProvider: {
        openElementTemplatesModal: spy
      }
    });

    // when
    const selectTemplate = container.querySelector('.bio-properties-panel-select-template-button');
    selectTemplate.click();

    // then
    expect(spy).to.have.been.calledOnce;
  });
});

// helpers //////////
async function createModeler(options = {}) {
  const modeler = new BpmnModeler({
    ...DEFAULT_OPTIONS,
    ...options
  });

  await modeler.importXML(diagramXML);

  const propertiesPanel = modeler.get('propertiesPanel');

  propertiesPanel.attachTo(options.container);

  return modeler;
}
