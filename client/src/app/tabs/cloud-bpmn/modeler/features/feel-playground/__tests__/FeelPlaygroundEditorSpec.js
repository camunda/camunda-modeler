/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React from 'react';

import { expect } from 'chai';

import sinon from 'sinon';

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react';

import { EditorView } from '@codemirror/view';

import FeelPlayground from '../FeelPlayground';

import FeelPlaygroundEditor from '../FeelPlaygroundEditor';


describe('<FeelPlaygroundEditor>', function() {

  it('should render', function() {

    // when
    const { container } = render(
      <FeelPlaygroundEditor
        contextKey="Task_1#expression"
        feelPlayground={ new FeelPlayground() }
        onInput={ () => {} }
        value="1 + 1"
        variables={ [] }
      />
    );

    // then
    expect(container.querySelector('.feel-playground-popup__editor')).to.exist;
  });


  it('should update configuration while open', async function() {

    // given
    const feelPlayground = new FeelPlayground();

    render(
      <FeelPlaygroundEditor
        contextKey="Task_1#expression"
        feelPlayground={ feelPlayground }
        onInput={ () => {} }
        value="1 + 1"
        variables={ [] }
      />
    );

    // when
    act(() => feelPlayground.setConfig({
      evaluationUnavailable: 'Cluster unavailable.'
    }));

    // then
    await waitFor(() => {
      expect(screen.getByText('Cluster unavailable.')).to.exist;
    });
  });


  it('should update context while open', async function() {

    // given
    const feelPlayground = new FeelPlayground();

    render(
      <FeelPlaygroundEditor
        contextKey="Task_1#expression"
        feelPlayground={ feelPlayground }
        onInput={ () => {} }
        value="1 + 1"
        variables={ [] }
      />
    );

    // when
    act(() => feelPlayground.setContext('Task_1#expression', '{ "amount": 42 }'));

    // then
    await waitFor(() => {
      expect(screen.getByLabelText('Evaluation context').textContent).to.equal('{ "amount": 42 }');
    });
  });


  it('should reset context from the current expression', async function() {

    // given
    const feelPlayground = new FeelPlayground();

    render(
      <FeelPlaygroundEditor
        contextKey="Task_1#expression"
        feelPlayground={ feelPlayground }
        onInput={ () => {} }
        value="1 + 1"
        variables={ [] }
      />
    );

    const expression = screen.getByLabelText('FEEL expression');
    const editor = EditorView.findFromDOM(expression);

    // when
    act(() => editor.dispatch({
      changes: {
        from: 0,
        to: editor.state.doc.length,
        insert: 'foo'
      }
    }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset to prefilled context' }));

    // then
    await waitFor(() => {
      expect(screen.getByLabelText('Evaluation context').textContent).to.contain('"foo": null');
    });
  });


  it('should save contexts when closed', function() {

    // given
    const feelPlayground = new FeelPlayground();
    const saveContextsSpy = sinon.spy(feelPlayground, 'saveContexts');

    const { unmount } = render(
      <FeelPlaygroundEditor
        contextKey="Task_1#expression"
        feelPlayground={ feelPlayground }
        onInput={ () => {} }
        value="1 + 1"
        variables={ [] }
      />
    );

    // when
    unmount();

    // then
    expect(saveContextsSpy).to.have.been.calledOnce;
  });

});