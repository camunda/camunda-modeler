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

import StatusButton from '../StatusButton';
import { Overlay } from '../../../../shared/ui';
import { Slot, SlotFillRoot } from '../../../slot-fill';

import { RPACodeEditor as MockRPACodeEditor } from 'test/mocks/rpa';


describe('<StatusButton>', function() {

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
    const editor = new MockRPACodeEditor();
    const wrapper = renderButton({ editor });

    // when
    editor.eventBus.fire('dialog.config.open');
    await wrapper.update();

    // then
    expect(wrapper.find(Overlay)).to.have.lengthOf(1);
  });

});

function renderButton(props = {}) {

  const {
    layout = {},
    onAction = () => {},
    editor = new MockRPACodeEditor()
  } = props;

  return mount(<SlotFillRoot>
    <Slot name="status-bar__file" />
    <StatusButton layout={ layout } onAction={ onAction } editor={ editor } />
  </SlotFillRoot>);

}