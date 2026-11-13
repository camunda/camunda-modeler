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

  it('should offer a connection action and remove it when connected', async function() {

    // given
    const feelPlayground = new FeelPlayground();
    const onConfigureConnection = sinon.spy();
    feelPlayground.setConfig({
      evaluationUnavailable: {
        title: 'Credentials rejected',
        message: 'Check the connection credentials.',
        action: { label: 'Manage connection', onClick: onConfigureConnection }
      }
    });

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
    const button = await screen.findByRole('button', { name: 'Manage connection' });
    fireEvent.click(button);

    // then
    expect(onConfigureConnection).to.have.been.calledOnce;
    expect(screen.getByRole('heading', { name: 'Credentials rejected' })).to.exist;
    expect(screen.getByText('Check the connection credentials.')).to.exist;

    // when
    act(() => feelPlayground.setConfig({
      onEvaluate: async () => ({ result: 2, warnings: [] })
    }));

    // then
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Manage connection' })).not.to.exist;
    });
  });

  it('should update the action when the connection message changes', async function() {

    // given
    const feelPlayground = new FeelPlayground();
    const onConfigureConnection = sinon.spy();
    feelPlayground.setConfig({
      evaluationUnavailable: {
        title: 'Credentials rejected',
        message: 'Check the connection credentials.',
        action: { label: 'Manage connection', onClick: onConfigureConnection }
      }
    });

    const { unmount } = render(
      <FeelPlaygroundEditor
        contextKey="Task_1#expression"
        feelPlayground={ feelPlayground }
        onInput={ () => {} }
        value="1 + 1"
        variables={ [] }
      />
    );
    await screen.findByRole('button', { name: 'Manage connection' });

    // when
    act(() => feelPlayground.setConfig({
      evaluationUnavailable: {
        title: 'No connection selected',
        message: 'Select a Camunda connection to evaluate expressions.',
        action: { label: 'Select connection', onClick: onConfigureConnection }
      }
    }));

    // then
    await waitFor(() => {
      const buttons = screen.getAllByRole('button', { name: 'Select connection' });
      expect(buttons).to.have.length(1);
      expect(screen.getByRole('heading', { name: 'No connection selected' })).to.exist;
      expect(screen.getByText('Select a Camunda connection to evaluate expressions.')).to.exist;
    });
    expect(screen.queryByRole('button', { name: 'Manage connection' })).not.to.exist;

    // when
    unmount();

    // then
    expect(screen.queryByRole('button', { name: 'Select connection' })).not.to.exist;
  });


  it('should not show a connection action in an idle result', async function() {

    // given
    const feelPlayground = new FeelPlayground();
    feelPlayground.setConfig({
      evaluationUnavailable: {
        title: 'No connection selected',
        message: 'Select a Camunda connection to evaluate expressions.',
        action: { label: 'Select connection', onClick: sinon.spy() }
      }
    });

    // when
    render(
      <FeelPlaygroundEditor
        contextKey="Task_1#expression"
        feelPlayground={ feelPlayground }
        onInput={ () => {} }
        value=""
        variables={ [] }
      />
    );

    // then
    await screen.findByText('Write an expression to see the result');
    expect(screen.queryByRole('button', { name: 'Select connection' })).not.to.exist;
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


  it('should not persist updated generated context when reopened', async function() {

    // given
    const config = {
      getForFile: sinon.stub().resolves(null),
      setForFile: sinon.stub().resolves()
    };
    const feelPlayground = new FeelPlayground(config);

    await feelPlayground.setFile({ path: '/tmp/diagram.bpmn' });

    const { rerender, unmount } = render(
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

    rerender(
      <FeelPlaygroundEditor
        contextKey="Task_1#expression"
        feelPlayground={ feelPlayground }
        onInput={ () => {} }
        value="foo + bar"
        variables={ [] }
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Update context variables' })).to.exist;
    });

    fireEvent.click(screen.getByRole('button', { name: 'Update context variables' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Evaluation context').textContent).to.contain('"bar": null');
    });

    // when
    unmount();

    render(
      <FeelPlaygroundEditor
        contextKey="Task_1#expression"
        feelPlayground={ feelPlayground }
        onInput={ () => {} }
        value="baz"
        variables={ [] }
      />
    );

    // then
    await waitFor(() => {
      expect(screen.getByLabelText('Evaluation context').textContent).to.contain('"baz": null');
    });

    expect(screen.getByLabelText('Evaluation context').textContent).not.to.contain('"foo": null');
    expect(screen.getByLabelText('Evaluation context').textContent).not.to.contain('"bar": null');
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