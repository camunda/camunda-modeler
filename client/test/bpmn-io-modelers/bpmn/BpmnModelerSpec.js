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

import BpmnModeler from '../../../src/app/tabs/bpmn/modeler/BpmnModeler';

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

// The modeler integration harness does not load the application stylesheet.
inlineCSS(`
  .djs-context-pad-tooltip--shortcut .bio-properties-panel-tooltip,
  .djs-create-pad-tooltip--shortcut .bio-properties-panel-tooltip {
    display: none;
  }
`);


describe('BpmnModeler', function() {

  this.timeout(10000);

  let modelerContainer;
  let modelerForCleanup;

  beforeEach(function() {
    modelerContainer = document.createElement('div');
    modelerContainer.classList.add('modeler-container');

    const container = TestContainer.get(this);

    container.appendChild(modelerContainer);
  });

  afterEach(function() {
    if (modelerForCleanup) {
      modelerForCleanup.destroy();
      modelerForCleanup = null;
    }
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


  describe('shortcut hints', function() {

    it('should show the context-pad shortcut tooltip when the new context pad is enabled', async function() {

      // given
      const settings = {
        get: () => true
      };

      const modeler = modelerForCleanup = await createModeler({
        container: modelerContainer,
        settings
      });

      const element = modeler.get('elementRegistry').get('StartEvent_1');

      // when
      modeler.get('contextPad').open(element);

      const replaceEntry = modelerContainer.querySelector(
        '.djs-context-pad [data-action="replace"]'
      );

      expect(replaceEntry).to.exist;

      await assertShortcutTooltip({
        container: modelerContainer,
        target: replaceEntry,
        title: 'Change element',
        shortcut: 'R'
      });

      // then
      expect(replaceEntry.getAttribute('aria-label')).to.equal('Change element');
      expect(replaceEntry.getAttribute('aria-keyshortcuts')).to.equal('R');
      expect(replaceEntry.hasAttribute('title')).to.equal(false);
    });


    it('should show the context-pad shortcut tooltip when the new context pad is disabled', async function() {

      // given
      const settings = {
        get: () => false
      };

      const modeler = modelerForCleanup = await createModeler({
        container: modelerContainer,
        settings
      });

      const element = modeler.get('elementRegistry').get('StartEvent_1');

      // when
      modeler.get('contextPad').open(element);

      const replaceEntry = modelerContainer.querySelector(
        '.djs-context-pad [data-action="replace"]'
      );

      expect(replaceEntry).to.exist;

      await assertShortcutTooltip({
        container: modelerContainer,
        target: replaceEntry,
        title: 'Change element',
        shortcut: 'R'
      });

      // then
      expect(replaceEntry.getAttribute('aria-label')).to.equal('Change element');
      expect(replaceEntry.getAttribute('aria-keyshortcuts')).to.equal('R');
      expect(replaceEntry.hasAttribute('title')).to.equal(false);
    });


    it('should show one append-pad shortcut tooltip without a duplicate tooltip', async function() {

      // given
      const settings = {
        get: () => true
      };

      const modeler = modelerForCleanup = await createModeler({
        container: modelerContainer,
        settings
      });

      const element = modeler.get('elementRegistry').get('StartEvent_1'),
            appendCreatePad = modeler.get('appendCreatePad');

      // when
      appendCreatePad.open(element);

      const appendEntry = modelerContainer.querySelector(
        '.djs-create-pad [data-entry-id="append"]'
      );

      expect(appendEntry).to.exist;

      await assertShortcutTooltip({
        container: modelerContainer,
        target: appendEntry,
        title: 'Append element',
        shortcut: 'A'
      });

      // then
      const legacyTooltip = appendEntry.closest('.djs-create-pad-tooltip')
        .querySelector('.bio-properties-panel-tooltip');

      expect(appendEntry.getAttribute('aria-keyshortcuts')).to.equal('A');
      expect(legacyTooltip).to.exist;
      expect(getComputedStyle(legacyTooltip).display).to.equal('none');
      expect(getVisibleTooltips(modelerContainer)).to.have.length(1);
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

  return modeler.importXML(diagramXML).then(() => modeler);
}

async function assertShortcutTooltip({ container, target, title, shortcut }) {
  const tooltipWrapper = target.closest('.bio-properties-panel-tooltip-wrapper');

  if (tooltipWrapper) {
    tooltipWrapper.dispatchEvent(new MouseEvent('mouseenter'));
  }

  target.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));

  await waitFor(() => {
    const tooltip = container.querySelector('.djs-hover-tooltip');

    expect(tooltip).to.exist;
    expect(tooltip.querySelector('.djs-palette-tooltip-label').textContent).to.equal(title);
    expect(tooltip.querySelector('.djs-palette-tooltip-shortcut').textContent).to.equal(shortcut);
    expect(getComputedStyle(tooltip).display).not.to.equal('none');
  });

  expect(getVisibleTooltips(container)).to.have.length(1);
}

function getVisibleTooltips(container) {
  return Array.from(container.querySelectorAll(
    '.djs-hover-tooltip, .bio-properties-panel-tooltip'
  )).filter(tooltip => {
    return getComputedStyle(tooltip).display !== 'none' &&
      getComputedStyle(tooltip).visibility !== 'hidden';
  });
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
