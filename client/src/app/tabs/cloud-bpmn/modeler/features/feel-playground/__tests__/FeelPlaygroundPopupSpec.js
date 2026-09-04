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


  it('should regenerate untouched context when reopened', async function() {

    // given
    const feelPlayground = new FeelPlayground();
    const Popup = createFeelPlaygroundPopup(feelPlayground);

    renderPopup(container, { value: 'foo' }, Popup);

    await waitFor(() => {
      expect(container.querySelector('[aria-label="Evaluation context"]').textContent).to.contain('"foo": null');
    });

    // when
    act(() => render(null, container));
    renderPopup(container, { value: 'bar' }, Popup);

    // then
    await waitFor(() => {
      expect(container.querySelector('[aria-label="Evaluation context"]').textContent).to.contain('"bar": null');
    });

    expect(container.querySelector('[aria-label="Evaluation context"]').textContent).not.to.contain('"foo": null');
    expect(feelPlayground.getContext('#expression')).not.to.exist;
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