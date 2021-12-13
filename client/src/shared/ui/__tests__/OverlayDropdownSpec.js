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

import {
  mount
} from 'enzyme';

import { OverlayDropdown } from '..';


describe('<OverlayDropdown>', function() {

  let mockButtonRef;

  beforeEach(function() {
    mockButtonRef = {
      current: <button />
    };
  });

  it('should render button content', () => {

    // given
    const wrapper = mount((
      <OverlayDropdown items={ [] } buttonRef={ mockButtonRef }>
        TestButton
      </OverlayDropdown>
    ));

    // then
    expect(wrapper.contains('TestButton')).to.be.true;
  });


  it('should open', () => {

    // given
    const wrapper = mount((
      <OverlayDropdown items={ [] } buttonRef={ mockButtonRef }>
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
      <OverlayDropdown items={ [] } buttonRef={ mockButtonRef }>
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
      <OverlayDropdown items={ items } buttonRef={ mockButtonRef }>
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
      <OverlayDropdown items={ items } buttonRef={ mockButtonRef }>
        TestButton
      </OverlayDropdown>
    ));
    wrapper.find('button').simulate('click');

    // when
    wrapper.find('Overlay button').simulate('click');

    // then
    expect(spy).to.have.been.calledOnce;
  });


  it('should group options', () => {

    // given
    const items = [
      { key: 'A', items: [ { text: 'foo' } ] },
      { key: 'B', items: [ { text: 'bar' } ] },
      { key: 'C', items: [ { text: 'foo' } ] }
    ];

    const wrapper = mount((
      <OverlayDropdown items={ items } buttonRef={ mockButtonRef }>
        TestButton
      </OverlayDropdown>
    ));

    // when
    wrapper.find('button').simulate('click');

    // then
    expect(wrapper.find('Overlay section')).to.have.length(3);
  });


  it('should set max height for option group', () => {

    // given
    const items = [
      { key: 'section', items: [], maxHeight: 300 }
    ];

    const wrapper = mount((
      <OverlayDropdown items={ items } buttonRef={ mockButtonRef }>
        TestButton
      </OverlayDropdown>
    ));

    // when
    wrapper.find('button').simulate('click');

    const section = wrapper.find('Overlay section').at(0);

    // then
    expect(section.prop('style')).to.eql({
      '--section-max-height': '300px'
    });
  });

});
