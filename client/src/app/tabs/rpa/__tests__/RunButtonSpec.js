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
import { render, fireEvent, waitFor } from '@testing-library/react';

import RunButton from '../RunButton';
import { Slot, SlotFillRoot } from '../../../slot-fill';

import { RPACodeEditor as MockRPACodeEditor } from 'test/mocks/rpa';

/* global sinon */

describe('<RunButton>', function() {

  it('should render', function() {

    // when
    const { getByRole } = renderButton();

    // then
    expect(getByRole('button')).to.exist;
  });


  it('should open dialog on click', async function() {

    // given
    const { getByRole } = renderButton();
    const button = getByRole('button');

    // when
    button.click();

    // then
    await waitFor(() => {
      expect(getByRole('dialog')).to.exist;
    });
  });


  it('should open dialog on event', async function() {

    // given
    const editor = new MockRPACodeEditor({
      state: { workerStatus: 'RUNNING' }
    });
    const { getByRole } = renderButton({ editor });

    // when
    editor.eventBus.fire('dialog.run.open');

    // then
    await waitFor(() => {
      expect(getByRole('dialog')).to.exist;
    });
  });


  it('should open output panel on close', async function() {

    // given
    const onAction = sinon.spy();
    const { getByRole } = renderButton({
      onAction,
    });

    const button = getByRole('button');
    button.click();

    await waitFor(() => {
      expect(getByRole('dialog')).to.exist;
    });

    // when
    fireEvent.submit(getByRole('dialog').querySelector('form'));

    // then
    expect(onAction).to.have.been.calledWith('open-panel', { tab: 'RPA-output' });
  });

});

function renderButton(props = {}) {

  const {
    layout = {},
    onAction = () => {},
    editor = new MockRPACodeEditor({
      state: { workerStatus: 'RUNNING' }
    })
  } = props;

  return render(<SlotFillRoot>
    <Slot name="status-bar__file" />
    <RunButton layout={ layout } onAction={ onAction } editor={ editor } />
  </SlotFillRoot>);

}