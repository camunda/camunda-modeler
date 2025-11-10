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
import { render } from '@testing-library/react';

import StatusButton from '../StatusButton';
import { Slot, SlotFillRoot } from '../../../slot-fill';

import { RPACodeEditor as MockRPACodeEditor } from 'test/mocks/rpa';


describe('<StatusButton>', function() {

  it('should render', function() {

    // when
    const { getByRole } = renderButton();

    // then
    expect(getByRole('button')).to.exist;
  });


  it('should open dialog on click', function() {

    // given
    const { getByRole } = renderButton();
    const button = getByRole('button');

    // when
    button.click();

    // then
    expect(getByRole('dialog')).to.exist;
  });


  it('should open dialog on event', async function() {

    // given
    const editor = new MockRPACodeEditor();
    const { getByRole } = renderButton({ editor });

    // when
    editor.eventBus.fire('dialog.config.open');

    // then
    expect(getByRole('dialog')).to.exist;
  });

});

function renderButton(props = {}) {

  const {
    layout = {},
    onAction = () => {},
    editor = new MockRPACodeEditor()
  } = props;

  return render(<SlotFillRoot>
    <Slot name="status-bar__file" />
    <StatusButton layout={ layout } onAction={ onAction } editor={ editor } />
  </SlotFillRoot>);

}