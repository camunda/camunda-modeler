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

import Flags, { DISABLE_AGENT_CONFIG_AUTOFIX } from '../../../src/util/Flags';

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


  describe('agent config autofix kill switch', function() {

    afterEach(Flags.reset);

    it('should register the agent config autofix module by default', async function() {

      // when
      const modeler = await createModeler();

      // then
      expect(modeler.get('agentConfigAutofillPropertiesProvider', false)).to.exist;
    });


    it('should not register the agent config autofix module when disabled through the flag', async function() {

      // given
      Flags.init({
        [ DISABLE_AGENT_CONFIG_AUTOFIX ]: true
      });

      // when
      const modeler = await createModeler();

      // then
      expect(modeler.get('agentConfigAutofillPropertiesProvider', false)).not.to.exist;
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


  describe('element templates - engine compatibility', function() {

    // cf. https://docs.camunda.io/docs/components/modeler/element-templates/template-metadata/#engine-compatibility-engines
    // and https://github.com/camunda/camunda-modeler/issues/6071

    const SCHEMA = 'https://unpkg.com/@camunda/zeebe-element-templates-json-schema/resources/schema.json';

    // the desktop modeler advertises itself as `camundaDesktopModeler` (cf.
    // BpmnEditor#createCachedState); `camunda` is intentionally not provided at
    // load time (it is only added on engine-profile change)
    const HOST_ENGINES = {
      camundaDesktopModeler: '5.30.0'
    };

    // schema-VALID, no engines => compatible with any host
    const VALID_COMPATIBLE = {
      $schema: SCHEMA,
      name: 'Valid Compatible',
      id: 'valid.compatible',
      appliesTo: [ 'bpmn:Task' ],
      properties: [
        {
          label: 'Name',
          type: 'String',
          binding: {
            type: 'property',
            name: 'name'
          }
        }
      ]
    };

    // schema-INVALID (`optional` not supported for property binding), compatible
    const INVALID_COMPATIBLE = {
      $schema: SCHEMA,
      name: 'Invalid Compatible',
      id: 'invalid.compatible',
      appliesTo: [ 'bpmn:Task' ],
      properties: [
        {
          type: 'String',
          optional: true,
          binding: {
            type: 'property',
            name: 'name'
          }
        }
      ]
    };

    // schema-INVALID + INCOMPATIBLE: authored for a newer desktop modeler than
    // the host provides (the #6071 scenario)
    const INVALID_INCOMPATIBLE = {
      ...INVALID_COMPATIBLE,
      name: 'Invalid Incompatible',
      id: 'invalid.incompatible',
      engines: {
        camundaDesktopModeler: '>=999.0.0'
      }
    };

    // schema-VALID, declares only a `camunda` engine which the host does not
    // provide at load => the engine key is ignored => compatible
    const VALID_CAMUNDA_ONLY = {
      $schema: SCHEMA,
      name: 'Valid Camunda Only',
      id: 'valid.camunda-only',
      engines: {
        camunda: '>=8.6'
      },
      appliesTo: [ 'bpmn:Task' ],
      properties: []
    };

    async function loadTemplates(templates) {

      // given
      const modeler = await createModeler({
        container: modelerContainer,
        elementTemplates: { engines: HOST_ENGINES },
        templates: []
      });

      const elementTemplates = modeler.get('elementTemplates'),
            elementTemplatesLoader = modeler.get('elementTemplatesLoader'),
            eventBus = modeler.get('eventBus');

      let reportedErrors = null;

      eventBus.on('elementTemplates.errors', (event) => {
        reportedErrors = event.errors;
      });

      // when
      elementTemplatesLoader.setTemplates(templates);

      return { modeler, elementTemplates, reportedErrors };
    }


    it('should silently ignore an engine-incompatible template', async function() {

      // when
      const { elementTemplates, reportedErrors } = await loadTemplates([ INVALID_INCOMPATIBLE ]);

      // then
      expect(reportedErrors).to.be.null;

      expect(elementTemplates.getAll()).to.be.empty;
    });


    it('should still report errors for an engine-compatible invalid template', async function() {

      // when
      const { elementTemplates, reportedErrors } = await loadTemplates([ INVALID_COMPATIBLE ]);

      // then
      expect(reportedErrors).not.to.be.empty;

      expect(elementTemplates.getAll()).to.be.empty;
    });


    it('should load an engine-compatible valid template', async function() {

      // when
      const { elementTemplates, reportedErrors } = await loadTemplates([ VALID_COMPATIBLE ]);

      // then
      expect(reportedErrors).to.be.null;

      const loaded = elementTemplates.getAll();

      expect(loaded).to.have.length(1);
      expect(loaded[0].id).to.eql('valid.compatible');
    });


    it('should treat a template with only a not-provided engine as compatible', async function() {

      // when
      const { elementTemplates, reportedErrors } = await loadTemplates([ VALID_CAMUNDA_ONLY ]);

      // then
      expect(reportedErrors).to.be.null;

      expect(elementTemplates.get('valid.camunda-only')).to.exist;
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
  const {
    templates = [ ELEMENT_TEMPLATE ],
    ...modelerOptions
  } = options;

  const modeler = new BpmnModeler({
    ...DEFAULT_OPTIONS,
    ...modelerOptions
  });

  await modeler.importXML(diagramXML);

  modeler.get('elementTemplatesLoader').setTemplates(templates);

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
