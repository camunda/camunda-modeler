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


  it('should regenerate untouched prefilled context when reopened', async function() {

    // given
    const config = {
      getForFile: sinon.stub().resolves(null),
      setForFile: sinon.stub().resolves()
    };
    const feelPlayground = new FeelPlayground(config);

    await feelPlayground.setFile({ path: '/tmp/diagram.bpmn' });

    const { unmount } = render(
      <FeelPlaygroundEditor
        contextKey="Task_1#expression"
        feelPlayground={ feelPlayground }
        onInput={ () => {} }
        value="foo"
        variables={ [] }
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Evaluation context').textContent).to.contain('"foo": null');
    });

    // when
    unmount();

    render(
      <FeelPlaygroundEditor
        contextKey="Task_1#expression"
        feelPlayground={ feelPlayground }
        onInput={ () => {} }
        value="bar"
        variables={ [] }
      />
    );

    // then
    await waitFor(() => {
      expect(screen.getByLabelText('Evaluation context').textContent).to.contain('"bar": null');
    });

    expect(screen.getByLabelText('Evaluation context').textContent).not.to.contain('"foo": null');
    expect(feelPlayground.getContext('Task_1#expression')).not.to.exist;
    expect(config.setForFile).not.to.have.been.called;
  });


  it('should persist prefilled context after user changes it', async function() {

    // given
    const config = {
      getForFile: sinon.stub().resolves(null),
      setForFile: sinon.stub().resolves()
    };
    const feelPlayground = new FeelPlayground(config);

    await feelPlayground.setFile({ path: '/tmp/diagram.bpmn' });

    const { unmount } = render(
      <FeelPlaygroundEditor
        contextKey="Task_1#expression"
        feelPlayground={ feelPlayground }
        onInput={ () => {} }
        value="foo"
        variables={ [] }
      />
    );

    const context = await screen.findByLabelText('Evaluation context');

    await waitFor(() => {
      expect(context.textContent).to.contain('"foo": null');
    });

    const editor = EditorView.findFromDOM(context);

    act(() => editor.dispatch({
      changes: {
        from: 0,
        to: editor.state.doc.length,
        insert: '{ "foo": 42 }'
      }
    }));

    // when
    unmount();

    // then
    expect(config.setForFile).to.have.been.calledOnce;
    expect(config.setForFile.firstCall.args[2].contexts).to.eql({
      'Task_1#expression': '{ "foo": 42 }'
    });
  });

});