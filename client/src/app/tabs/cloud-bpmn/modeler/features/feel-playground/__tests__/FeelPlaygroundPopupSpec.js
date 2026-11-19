/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/** @jsx h */

import { expect } from 'chai';

import sinon from 'sinon';

import EventBus from 'diagram-js/lib/core/EventBus';

import { FeelPopupModule, PropertiesPanel } from '@bpmn-io/properties-panel';

import { fireEvent, waitFor } from '@testing-library/react';

import {
  h,
  render
} from '@bpmn-io/properties-panel/preact';
import { act } from '@bpmn-io/properties-panel/preact/test-utils';

import FeelPlayground from '../FeelPlayground';
import {
  createFeelPlaygroundPopup,
  isSnippetNavigation
} from '../FeelPlaygroundPopup';


describe('<FeelPlaygroundPopup>', function() {

  let container;

  beforeEach(function() {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(function() {
    act(() => render(null, container));
    container.remove();
  });


  it('should render React content', async function() {

    // when
    renderPopup(container);

    // then
    await waitFor(() => {
      expect(container.querySelector('.feel-playground-popup__editor')).to.exist;
    });
  });


  it('should unmount React content', async function() {

    // given
    renderPopup(container);

    await waitFor(() => {
      expect(container.querySelector('.feel-playground-popup__editor')).to.exist;
    });

    // when
    act(() => render(null, container));

    // then
    expect(container.querySelector('.feel-playground-popup__editor')).not.to.exist;
  });


  it('should use the playground default size and allow resizing', function() {

    // when
    renderPopup(container);

    // then
    const popup = container.querySelector('.bio-properties-panel-popup');
    expect(popup.style.width).to.equal('900px');
    expect(popup.style.height).to.equal('640px');
    expect(popup.classList.contains('resizable')).to.be.true;
  });


  [ 'feel', 'text' ].forEach(type => {

    it(`should restore ${type} popup size and position after recreating the panel`, function() {

      // given
      const eventBus = new EventBus();
      const PopupManager = FeelPopupModule.feelPopup[1];
      const PopupRenderer = FeelPopupModule.feelPopupRenderer[1];
      const manager = new PopupManager(eventBus, { feelPopupContainer: container });
      new PopupRenderer(eventBus);
      manager.registerProvider('feel', createFeelPlaygroundPopup(new FeelPlayground()));

      const panel = document.createElement('div');
      container.appendChild(panel);
      let savedLayout;
      const layoutChanged = layout => { savedLayout = layout; };
      const renderPanel = (layoutConfig) => render(
        <PropertiesPanel
          element={ {} }
          groups={ [] }
          eventBus={ eventBus }
          layoutConfig={ layoutConfig }
          layoutChanged={ layoutChanged }
        />,
        panel
      );
      const openPopup = () => manager.open('expression', {
        type,
        label: 'Expression',
        value: '1 + 1',
        onInput: () => {}
      });

      act(() => {
        renderPanel();
        openPopup();
      });
      const popup = container.querySelector('.bio-properties-panel-popup');
      Object.assign(popup.style, {
        position: 'fixed', width: '450px', height: '300px', top: '25px', left: '35px'
      });
      act(() => manager.close());
      const persistedLayout = JSON.parse(JSON.stringify(savedLayout));
      act(() => render(null, panel));

      // when
      act(() => {
        renderPanel(persistedLayout);
        openPopup();
      });

      // then
      const restored = container.querySelector('.bio-properties-panel-popup');
      expect(persistedLayout.popups[type]).to.eql({
        size: { width: 450, height: 300 },
        position: { top: 25, left: 35 }
      });
      expect(restored.style.width).to.equal('450px');
      expect(restored.style.height).to.equal('300px');
      expect(restored.style.top).to.equal('25px');
      expect(restored.style.left).to.equal('35px');

      act(() => manager.close());
      act(() => render(null, panel));
    });

  });


  it('should close on Escape', async function() {

    // given
    const onClose = sinon.spy();
    renderPopup(container, { onClose });

    const content = await getExpressionContent(container);

    // when
    fireEvent.keyDown(content, { key: 'Escape' });

    // then
    expect(onClose).to.have.been.calledOnce;
  });


  it('should keep open when closing autocomplete', async function() {

    // given
    const onClose = sinon.spy();
    renderPopup(container, { onClose });

    const content = await getExpressionContent(container);
    const tooltip = document.createElement('div');
    tooltip.className = 'cm-tooltip-autocomplete';
    content.closest('.cm-editor').appendChild(tooltip);

    // when
    fireEvent.keyDown(content, { key: 'Escape' });

    // then
    expect(onClose).not.to.have.been.called;
  });


  it('should detect snippet navigation', function() {

    // given
    const editor = document.createElement('div');
    const content = document.createElement('div');
    const snippet = document.createElement('span');
    editor.className = 'cm-editor';
    snippet.className = 'cm-snippetField';
    editor.append(content, snippet);

    // when
    const result = isSnippetNavigation({ target: content });

    // then
    expect(result).to.be.true;
  });

});


// helpers //////////

function renderPopup(container, props = {}, Popup = createFeelPlaygroundPopup(new FeelPlayground())) {

  act(() => render(
    <Popup
      entryId="expression"
      onClose={ () => {} }
      onInput={ () => {} }
      title="Expression"
      value="1 + 1"
      { ...props }
    />,
    container
  ));
}

async function getExpressionContent(container) {
  let content;

  await waitFor(() => {
    content = container.querySelector('[aria-label="FEEL expression"]');
    expect(content).to.exist;
  });

  return content;
}