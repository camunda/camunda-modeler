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

import BpmnModeler from '../../../src/app/tabs/bpmn/modeler/BpmnModeler';

import diagramXML from './diagram.bpmn';

import Flags, { ENABLE_NEW_CONTEXT_PAD } from '../../../src/util/Flags';

const DEFAULT_OPTIONS = {
  exporter: {
    name: 'my-tool',
    version: '120-beta.100'
  }
};


inlineCSS(require('camunda-bpmn-js/dist/assets/camunda-platform-modeler.css'));

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

    beforeEach(function() {
      Flags.reset();
    });


    it('should disable new context pad by default', async function() {

      // when
      const modeler = await createModeler();

      // then
      expect(modeler.get('improvedCanvas', false)).not.to.exist;
    });


    it('should enable new context pad if enabled through flag', async function() {

      // when
      Flags.init({
        [ ENABLE_NEW_CONTEXT_PAD ]: true
      });

      const modeler = await createModeler();

      // then
      expect(modeler.get('improvedCanvas', false)).to.exist;
    });


    it('should not fail when append element is triggered', async function() {

      // when
      Flags.init({
        [ ENABLE_NEW_CONTEXT_PAD ]: true
      });

      const modeler = await createModeler();

      // then
      const editorActions = modeler.get('editorActions'),
            event = new KeyboardEvent('keydown', { target: modelerContainer });

      expect(() => editorActions.trigger('appendElement', event)).not.to.throw();
    });

  });

});

// helpers //////////

/**
 * Create modeler and wait for modeler and overview import to finish before returning modeler.
 *
 * @param {Object} [options]
 *
 * @returns {Object}
 */
async function createModeler(options = {}) {
  const modeler = new BpmnModeler({
    ...DEFAULT_OPTIONS,
    ...options
  });

  return modeler.importXML(diagramXML).then(() => modeler);
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
