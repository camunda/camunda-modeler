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

import { act, render, fireEvent, screen, waitFor } from '@testing-library/react';

import { PanelToggleHint } from '../PanelToggleHint';

import { Config } from '../../__tests__/mocks';

/* global sinon */


describe('<PanelToggleHint>', function() {

  let anchor;

  beforeEach(function() {
    anchor = document.createElement('div');
    document.body.appendChild(anchor);
  });

  afterEach(function() {
    if (anchor && anchor.parentNode) {
      anchor.parentNode.removeChild(anchor);
    }
  });


  it('should show overlay for allowed tab type', async function() {

    // when
    await createPanelToggleHint({
      activeTab: { type: 'cloud-bpmn' },
      anchor
    });

    // then
    expect(screen.getByRole('dialog')).to.exist;
  });


  it('should show overlay when config returns null', async function() {

    // given
    const get = () => null;
    const config = new Config({ get });

    // when
    await createPanelToggleHint({
      activeTab: { type: 'cloud-bpmn' },
      config,
      anchor
    });

    // then
    expect(screen.getByRole('dialog')).to.exist;
  });


  it('should NOT show overlay if already dismissed', async function() {

    // given
    const get = () => ({ panelToggleDismissed: true });
    const config = new Config({ get });

    // when
    await createPanelToggleHint({
      activeTab: { type: 'cloud-bpmn' },
      config,
      anchor
    });

    // then
    expect(screen.queryByRole('dialog')).to.be.null;
  });


  it('should NOT show overlay for non-allowed tab types', async function() {

    // when
    await createPanelToggleHint({
      activeTab: { type: 'form' },
      anchor
    });

    // then
    expect(screen.queryByRole('dialog')).to.be.null;
  });


  it('should NOT show overlay when activeTab is null', async function() {

    // when
    await createPanelToggleHint({
      activeTab: null,
      anchor
    });

    // then
    expect(screen.queryByRole('dialog')).to.be.null;
  });


  it('should display expected content for cloud-bpmn tab', async function() {

    // when
    await createPanelToggleHint({
      activeTab: { type: 'cloud-bpmn' },
      anchor
    });

    // then
    expect(screen.getByText('Panel toggle buttons')).to.exist;
    expect(screen.getByText(/Toggle the Variables, Properties, and Test panels/)).to.exist;
  });


  it('should display expected content for non-cloud-bpmn tab', async function() {

    // when
    await createPanelToggleHint({
      activeTab: { type: 'bpmn' },
      anchor
    });

    // then
    expect(screen.getByText('Panel toggle button')).to.exist;
    expect(screen.getByText(/Toggle the Properties panel using this button/)).to.exist;
  });


  it('should dismiss when close button is clicked', async function() {

    // given
    const set = sinon.spy();
    const config = new Config({ set });

    await createPanelToggleHint({
      activeTab: { type: 'cloud-bpmn' },
      config,
      anchor
    });

    expect(screen.getByRole('dialog')).to.exist;

    // when
    fireEvent.click(screen.getByLabelText('Close'));

    // then
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).to.be.null;
    });
  });


  it('should persist dismissal via config', async function() {

    // given
    const set = sinon.spy();
    const config = new Config({ set });

    await createPanelToggleHint({
      activeTab: { type: 'cloud-bpmn' },
      config,
      anchor
    });

    expect(screen.getByRole('dialog')).to.exist;

    // when
    fireEvent.click(screen.getByLabelText('Close'));

    // then
    await waitFor(() => {
      expect(set).to.have.been.calledWith(
        'hints',
        sinon.match({ panelToggleDismissed: true })
      );
    });
  });


  it('should dismiss when anchor is clicked', async function() {

    // given
    const set = sinon.spy();
    const config = new Config({ set });

    await createPanelToggleHint({
      activeTab: { type: 'cloud-bpmn' },
      config,
      anchor
    });

    expect(screen.getByRole('dialog')).to.exist;

    // when
    fireEvent.click(anchor);

    // then
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).to.be.null;
      expect(set).to.have.been.calledWith(
        'hints',
        sinon.match({ panelToggleDismissed: true })
      );
    });
  });


  it('should NOT show overlay if anchor is missing', async function() {

    // when
    await createPanelToggleHint({
      activeTab: { type: 'cloud-bpmn' },
      anchor: null
    });

    // then
    expect(screen.queryByRole('dialog')).to.be.null;
  });


  it('should stay dismissed across re-renders', async function() {

    // given
    const set = sinon.spy();
    const config = new Config({ set });

    const { rerender } = await createPanelToggleHint({
      activeTab: { type: 'cloud-bpmn' },
      config,
      anchor
    });

    expect(screen.getByRole('dialog')).to.exist;

    // when
    fireEvent.click(screen.getByLabelText('Close'));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).to.be.null;
    });

    await rerender(
      <PanelToggleHint
        activeTab={ { type: 'cloud-bpmn' } }
        config={ config }
        anchor={ anchor }
      />
    );

    // then
    expect(screen.queryByRole('dialog')).to.be.null;
  });

});


async function createPanelToggleHint(props = {}) {
  const {
    activeTab = null,
    config = new Config(),
    anchor = null
  } = props;

  let result;

  await act(async () => {
    result = render(
      <PanelToggleHint
        activeTab={ activeTab }
        config={ config }
        anchor={ anchor }
      />
    );
  });

  return result;
}
