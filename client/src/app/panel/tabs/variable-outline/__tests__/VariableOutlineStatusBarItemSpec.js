/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/* global sinon */

import React from 'react';

import { mount } from 'enzyme';

import {
  SlotFillRoot,
  Slot
} from '../../../../slot-fill';

import VariableOutlineStatusBarItem from '../VariableOutlineStatusBarItem';

const spy = sinon.spy;


describe('VariableOutlineStatusBarItem', function() {

  it('should render', function() {

    // when
    const wrapper = renderVariableOutlineStatusBarItem();

    // then
    expect(wrapper.find(VariableOutlineStatusBarItem).exists()).to.be.true;
  });


  describe('toggle', function() {

    it('should be active (open)', function() {

      // when
      const wrapper = renderVariableOutlineStatusBarItem({
        layout: {
          panel: {
            open: true,
            tab: 'variable-outline'
          }
        }
      });

      // then
      expect(wrapper.find('.btn').hasClass('btn--active')).to.be.true;
    });


    it('should not be active (closed)', function() {

      // when
      const wrapper = renderVariableOutlineStatusBarItem();

      // then
      expect(wrapper.find('.btn').hasClass('btn--active')).to.be.false;
    });


    it('should call callback on toggle', function() {

      // given
      const onToggleSpy = spy();

      const wrapper = renderVariableOutlineStatusBarItem({
        onToggle: onToggleSpy
      });

      // when
      wrapper.find('.btn').simulate('click');

      // then
      expect(onToggleSpy).to.have.been.calledOnce;
    });

  });

});


// helpers //////////

const defaultLayout = {
  panel: {
    open: false,
    tab: 'variable-outline'
  }
};


function renderVariableOutlineStatusBarItem(options = {}) {
  const {
    layout = defaultLayout,
    onToggle
  } = options;

  return mount(
    <SlotFillRoot>
      <Slot name="status-bar__file" />
      <VariableOutlineStatusBarItem
        layout={ layout }
        onToggle={ onToggle } />
    </SlotFillRoot>
  );
}
