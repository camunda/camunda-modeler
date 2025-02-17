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
import { mount } from 'enzyme';
import { RunDialog } from '@camunda/rpa-integration';

import RunButton from '../RunButton';
import { Overlay } from '../../../../shared/ui';
import { Slot, SlotFillRoot } from '../../../slot-fill';

import { RPACodeEditor as MockRPACodeEditor } from 'test/mocks/rpa';

/* global sinon */

describe('<RunButton>', function() {

  it('should render', function() {

    // when
    const wrapper = renderButton();

    // then
    expect(wrapper.find('button')).to.have.lengthOf(1);
  });


  it('should open dialog on click', function() {

    // given
    const wrapper = renderButton();
    const button = wrapper.find('button');

    // when
    button.simulate('click');

    // then
    expect(wrapper.find(Overlay)).to.have.lengthOf(1);
  });


  it('should open dialog on event', async function() {

    // given
    const editor = new MockRPACodeEditor({
      state: { workerStatus: 'RUNNING' }
    });
    const wrapper = renderButton({ editor });

    // when
    editor.eventBus.fire('dialog.run.open');
    await wrapper.update();

    // then
    expect(wrapper.find(Overlay)).to.have.lengthOf(1);
  });


  it('should open output panel on close', function() {

    // given
    const onAction = sinon.spy();
    const wrapper = renderButton({
      onAction,
    });

    wrapper.find('button').simulate('click');

    // when
    wrapper.find(RunDialog).prop('onSubmit')();

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

  return mount(<SlotFillRoot>
    <Slot name="status-bar__file" />
    <RunButton layout={ layout } onAction={ onAction } editor={ editor } />
  </SlotFillRoot>);

}