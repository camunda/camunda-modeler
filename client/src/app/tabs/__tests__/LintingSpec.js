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
} from '../../slot-fill';

import { Linting } from '../Linting';

const spy = sinon.spy;


describe('Linting', function() {

  it('should render', function() {

    // when
    const wrapper = renderLinting();

    // then
    expect(wrapper.find(Linting).exists()).to.be.true;
  });


  describe('number of errors and warnings', function() {

    it('should display 1 error and 1 warning', function() {

      // when
      const wrapper = renderLinting();

      // then
      expect(wrapper.find('.errors').text()).to.equal('1');
      expect(wrapper.find('.warnings').text()).to.equal('1');
    });


    it('should display 2 errors and 1 warning', function() {

      // when
      const wrapper = renderLinting({
        linting: [
          ...defaultLinting,
          {
            category: 'error',
            id: 'baz',
            message: 'Baz'
          }
        ]
      });

      // then
      expect(wrapper.find('.errors').text()).to.equal('2');
      expect(wrapper.find('.warnings').text()).to.equal('1');
    });

  });


  describe('toggle', function() {

    it('should be active (open)', function() {

      // when
      const wrapper = renderLinting({
        layout: {
          panel: {
            open: true,
            tab: 'linting'
          }
        }
      });

      // then
      expect(wrapper.find('.btn').hasClass('btn--active')).to.be.true;
    });


    it('should not be active (closed)', function() {

      // when
      const wrapper = renderLinting();

      // then
      expect(wrapper.find('.btn').hasClass('btn--active')).to.be.false;
    });


    it('should call callback on toggle', function() {

      // given
      const onToggleLintingSpy = spy();

      const wrapper = renderLinting({
        onToggleLinting: onToggleLintingSpy
      });

      // when
      wrapper.find('.btn').simulate('click');

      // then
      expect(onToggleLintingSpy).to.have.been.calledOnce;
    });

  });

});


// helpers //////////

const defaultLayout = {
  panel: {
    open: false,
    tab: 'linting'
  }
};

const defaultLinting = [
  {
    category: 'error',
    id: 'foo',
    message: 'Foo message'
  },
  {
    category: 'warn',
    id: 'bar',
    message: 'Bar message'
  }
];

function renderLinting(options = {}) {
  const {
    layout = defaultLayout,
    linting = defaultLinting,
    onToggleLinting
  } = options;

  return mount(
    <SlotFillRoot>
      <Slot name="status-bar__file" />
      <Linting
        layout={ layout }
        linting={ linting }
        onToggleLinting={ onToggleLinting } />
    </SlotFillRoot>
  );
}
