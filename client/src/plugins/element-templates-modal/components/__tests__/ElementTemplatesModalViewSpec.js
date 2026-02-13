/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/* global sinon */

import React from 'react';

import { render, waitFor, screen, fireEvent } from '@testing-library/react';

import ElementTemplatesView, {
  getVersion
} from '../ElementTemplatesModalView';

import { BpmnModdle } from 'bpmn-moddle';
import camundaModdlePackage from 'camunda-bpmn-moddle/resources/camunda';

const moddle = new BpmnModdle({ camunda: camundaModdlePackage });

describe('<ElementTemplatesView>', function() {

  describe('basics', function() {

    it('should render', function() {

      // when
      createElementTemplatesModalView();

      // then
      expect(screen.getByText('Select template')).to.exist;
    });


    it('should get element templates (sorted alphabetically)', async function() {

      // given
      createElementTemplatesModalView();

      // then
      await waitFor(() => {
        const t1 = screen.getByText('Template 1');
        const t2 = screen.getByText('Template 2');
        const t4 = screen.getByText('Template 4');

        expect(t1.compareDocumentPosition(t2)).to.equal(Node.DOCUMENT_POSITION_FOLLOWING);
        expect(t2.compareDocumentPosition(t4)).to.equal(Node.DOCUMENT_POSITION_FOLLOWING);
      });
    });


    it('should display meta data', async function() {

      // given
      createElementTemplatesModalView({
        selectedElement: {
          businessObject: moddle.create('bpmn:SendTask')
        }
      });

      // then
      await waitFor(() => {
        expect(screen.getByText(/Version 2/)).to.exist;
      });
    });


    it('should not list element templates (no element templates for element type)', async function() {

      // given
      function triggerAction(action) {
        if (action === 'getSelectedElementType') {
          return 'bpmn:StartEvent';
        }
      }

      // when
      createElementTemplatesModalView({ triggerAction });

      // then
      expect(screen.getByText('No matching templates found.')).to.exist;
    });


    it('should select element template', async function() {

      // given
      createElementTemplatesModalView();

      // assume
      await screen.findByText('Template 1');

      // when
      const template = screen.getByText('Template 1');
      template.click();

      // then
      await waitFor(() => {
        expect(template.closest('li').classList.contains('element-templates-list__item--selected')).to.be.true;
      });
    });


    it('should toggle expanded (expand)', async function() {

      // given
      createElementTemplatesModalView();

      // assume
      await screen.findByText('Template 1');

      // when
      const expand = await screen.findByText('More');
      expand.click();

      // then
      await waitFor(() => {
        expect(screen.getByText(DEFAULT_ELEMENT_TEMPLATES[2].description)).to.exist;
      });
    });


    it('should toggle expanded (collapse)', async function() {

      // given
      createElementTemplatesModalView();

      // assume
      await screen.findByText('Template 1');

      // when
      const expand = await screen.findByText('More');
      expand.click();

      // then
      await waitFor(() => {
        expect(screen.getByText(DEFAULT_ELEMENT_TEMPLATES[2].description)).to.exist;
      });

      // when
      const collapse = screen.getByText('Less');
      collapse.click();

      // then
      await waitFor(() => {
        expect(screen.queryByText(DEFAULT_ELEMENT_TEMPLATES[2].description)).to.be.null;
      });
    });
  });


  describe('apply element template', function() {

    it('should apply element template', async function() {

      // given
      const onApplySpy = sinon.spy();

      createElementTemplatesModalView({ onApply: onApplySpy });

      // assume
      const template = await screen.findByText('Template 1');

      // when
      template.click();

      // wait for selection to take effect
      await waitFor(() => {
        expect(template.closest('li').classList.contains('element-templates-list__item--selected')).to.be.true;
      });

      const applyButton = screen.getByRole('button', { name: 'Apply' });
      applyButton.click();

      // then
      expect(onApplySpy).to.have.been.calledWith(DEFAULT_ELEMENT_TEMPLATES.find(({ id }) => id === 'some-rpa-template'));
    });


    it('should not apply element template (no element template selected)', async function() {

      // given
      const onApplySpy = sinon.spy();

      createElementTemplatesModalView({ onApply: onApplySpy });

      // assume
      await screen.findByText('Template 1');

      // when
      const applyButton = screen.getByRole('button', { name: 'Apply' });
      applyButton.click();

      // then
      expect(onApplySpy).to.not.have.been.called;
    });

  });


  describe('filter', function() {

    it('should filter by search', async function() {

      // given
      createElementTemplatesModalView();

      // assume
      await screen.findByText('Template 2');

      // when
      const search = screen.getByPlaceholderText('Type to search...');
      fireEvent.change(search, { target: { value: 'Template 1' } });

      // then
      await waitFor(() => {
        expect(screen.getByText('Template 1')).to.exist;
        expect(screen.queryByText('Template 2')).to.be.null;
      });
    });


    it('should disable apply button if selected element template does not match filter', async function() {

      // given
      createElementTemplatesModalView();

      // assume
      const template = await screen.findByText('Template 2');

      // when
      template.click();

      // wait for selection to take effect
      await waitFor(() => {
        expect(template.closest('li').classList.contains('element-templates-list__item--selected')).to.be.true;
      });

      // then
      const applyButton = screen.getByRole('button', { name: 'Apply' });
      expect(applyButton.disabled).to.be.false;

      // when
      const search = screen.getByPlaceholderText('Type to search...');
      fireEvent.change(search, { target: { value: 'Template 1' } });

      // then
      await waitFor(() => {
        expect(applyButton.disabled).to.be.true;
      });
    });

  });


  describe('#getVersion', function() {

    it('should get version', function() {

      // given
      const template = {
        version: 1
      };

      // when
      const version = getVersion(template);

      // then
      expect(version).to.equal(1);
    });


    it('should not get version', function() {

      // given
      const template = {};

      // when
      const version = getVersion(template);

      // then
      expect(version).to.be.null;
    });

  });

});

// helpers //////////

const DEFAULT_ELEMENT_TEMPLATES = [
  {
    appliesTo: [
      'bpmn:ServiceTask'
    ],
    id: 'another-rpa-template',
    name: 'Template 2',
    properties: []
  },
  {
    appliesTo: [
      'bpmn:UserTask'
    ],
    id: 'user-task-template',
    name: 'Template 3',
    properties: []
  },
  {
    appliesTo: [
      'bpmn:ServiceTask'
    ],
    id: 'some-rpa-template',
    description: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    name: 'Template 1',
    properties: []
  },
  {
    appliesTo: [
      'bpmn:Activity'
    ],
    id: 'some-local-template',
    name: 'Template 4',
    properties: []
  },
  {
    appliesTo: [
      'bpmn:SendTask'
    ],
    id: 'versioned-template',
    version: 2,
    name: 'Template 5 v2',
    properties: []
  }
];

function createElementTemplatesModalView(props = {}) {
  function triggerAction(action) {
    if (action === 'getSelectedElement') {
      return props.selectedElement || {
        businessObject: moddle.create('bpmn:ServiceTask')
      };
    } else if (action === 'getElementTemplates') {
      return props.elementTemplates || DEFAULT_ELEMENT_TEMPLATES;
    }
  }

  const defaultProps = {
    displayNotification() {},
    getConfig() {},
    onApply() {},
    onClose() {},
    subscribe() {},
    triggerAction
  };

  return render(<ElementTemplatesView { ...{ ...defaultProps, ...props } } />);
}
