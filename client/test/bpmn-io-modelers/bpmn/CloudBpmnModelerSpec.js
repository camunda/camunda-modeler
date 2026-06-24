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
import TestContainer from 'mocha-test-container-support';

import { waitFor } from '@testing-library/react';

import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';

import BpmnModeler from '../../../src/app/tabs/cloud-bpmn/modeler/BpmnModeler';

import diagramXML from './diagram.bpmn';

const DEFAULT_OPTIONS = {
  exporter: {
    name: 'my-tool',
    version: '120-beta.100'
  },
  settings: {
    get: () => false,
  }
};

const ELEMENT_TEMPLATE = {
  $schema: 'https://unpkg.com/@camunda/zeebe-element-templates-json-schema/resources/schema.json',
  name: 'Template 1',
  id: 'template-1',
  appliesTo: [ 'bpmn:StartEvent' ],
  properties: []
};


inlineCSS(require('camunda-bpmn-js/dist/assets/camunda-platform-modeler.css'));
inlineCSS(require('camunda-bpmn-js/dist/assets/element-template-chooser.css'));

inlineCSS(`
  .test-content-container {
    display: flex;
    flex-direction: row;
  }

  .modeler-container {
    height: 100%;
  }
`);


describe('BpmnModeler', function() {

  this.timeout(10000);

  let modelerContainer;

  beforeEach(function() {
    modelerContainer = document.createElement('div');
    modelerContainer.classList.add('modeler-container');

    const container = TestContainer.get(this);

    container.appendChild(modelerContainer);
  });


  it('should bootstrap', async function() {

    // when
    const modeler = await createModeler({
      container: modelerContainer
    });

    // then
    expect(modeler).to.exist;
  });


  describe('new context pad', function() {

    it('should disable new context pad by default', async function() {

      // when
      const modeler = await createModeler();

      // then
      expect(modeler.get('improvedCanvas', false)).not.to.exist;
    });


    it('should enable new context pad if enabled through flag or setting', async function() {

      // when
      const settings = {
        get: () => true
      };

      const modeler = await createModeler({ settings });

      // then
      expect(modeler.get('improvedCanvas', false)).to.exist;
    });


    it('should not fail when append element is triggered', async function() {

      // when
      const settings = {
        get: () => true
      };

      const modeler = await createModeler({ settings });

      // then
      const editorActions = modeler.get('editorActions'),
            event = new KeyboardEvent('keydown', { target: modelerContainer });

      expect(() => editorActions.trigger('appendElement', event)).not.to.throw();
    });

  });


  describe('element template chooser', function() {

    it('should open chooser on <elementTemplates.select>', async function() {

      // given
      const modeler = await createModeler({ container: modelerContainer });

      const eventBus = modeler.get('eventBus'),
            popupMenu = modeler.get('popupMenu'),
            elementRegistry = modeler.get('elementRegistry');

      const element = elementRegistry.get('StartEvent_1');

      // when
      eventBus.fire('elementTemplates.select', { element });

      // then
      await waitFor(() => {
        expect(popupMenu.isOpen()).to.be.true;
      });
    });


    it('should apply chosen element template', async function() {

      // given
      const modeler = await createModeler({ container: modelerContainer });

      const eventBus = modeler.get('eventBus'),
            elementTemplates = modeler.get('elementTemplates'),
            elementRegistry = modeler.get('elementRegistry');

      const element = elementRegistry.get('StartEvent_1');

      const template = elementTemplates.get('template-1');

      // when
      eventBus.fire('elementTemplates.select', { element });
      eventBus.fire('elementTemplateChooser.chosen', { element, template });

      // then
      await waitFor(() => {
        expect(getBusinessObject(element).get('modelerTemplate')).to.eql('template-1');
      });
    });

  });

});

// helpers //////////

/**
 * Create modeler and wait for modeler and overview import to finish before returning modeler.
 *
 * @param {Object} [options]
 */
async function createModeler(options = {}) {
  const modeler = new BpmnModeler({
    ...DEFAULT_OPTIONS,
    ...options
  });

  await modeler.importXML(diagramXML);

  modeler.get('elementTemplatesLoader').setTemplates([ ELEMENT_TEMPLATE ]);

  return modeler;
}

function inlineCSS(css) {
  var head = document.head || document.getElementsByTagName('head')[ 0 ],
      style = document.createElement('style');

  style.type = 'text/css';

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }

  head.appendChild(style);
}
