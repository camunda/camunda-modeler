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

import TestContainer from 'mocha-test-container-support';

import {
  mount
} from 'enzyme';

import { OverlayDropdown } from '..';


describe('<OverlayDropdown>', function() {

  let wrapper, anchor;


  beforeEach(function() {
    anchor = document.createElement('button');
    anchor.textContent = 'Anchor';

    const testContainer = TestContainer.get(this);

    testContainer.appendChild(anchor);
  });


  afterEach(function() {
    if (wrapper && wrapper.exists()) {
      wrapper.unmount();
    }
  });


  it('should render button content', () => {

    // given
    const wrapper = mount((
      <OverlayDropdown items={ [] }>
        TestButton
      </OverlayDropdown>
    ));

    // then
    expect(wrapper.contains('TestButton')).to.be.true;
  });


  it('should open', () => {

    // given
    const wrapper = mount((
      <OverlayDropdown items={ [] }>
        TestButton
      </OverlayDropdown>
    ));

    // when
    wrapper.find('button').simulate('click');

    // then
    expect(wrapper.exists('Overlay')).to.be.true;
  });


  it('should close when button is clicked again', () => {

    // given
    const wrapper = mount((
      <OverlayDropdown items={ [] }>
        TestButton
      </OverlayDropdown>
    ));
    wrapper.find('button').simulate('click');

    // when
    wrapper.find('button').simulate('click');

    // then
    expect(wrapper.exists('Overlay')).to.be.false;
  });


  it('should close when option is selected', () => {

    // given
    const items = [{ text: 'TestOption', onClick: () => {} }];
    const wrapper = mount((
      <OverlayDropdown items={ items }>
        TestButton
      </OverlayDropdown>
    ));
    wrapper.find('button').simulate('click');

    // when
    wrapper.find('Overlay button').simulate('click');

    // then
    expect(wrapper.exists('Overlay')).to.be.false;
  });


  it('should call passed onClick callback when option is selected', () => {

    // given
    const spy = sinon.spy();
    const items = [{ text: 'TestOption', onClick: spy }];
    const wrapper = mount((
      <OverlayDropdown items={ items }>
        TestButton
      </OverlayDropdown>
    ));
    wrapper.find('button').simulate('click');

    // when
    wrapper.find('Overlay button').simulate('click');

    // then
    expect(spy).to.have.been.calledOnce;
  });
});
