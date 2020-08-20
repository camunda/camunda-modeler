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

import Input from '../Input';


describe('<Input>', function() {


  it('should render', function() {

    // when
    const wrapper = mount(<Input />);

    // then
    expect(wrapper).to.exist;
  });


  it('#onChange', function() {

    // given
    const onChangeSpy = sinon.spy();

    const wrapper = mount(<Input onChange={ onChangeSpy } />);

    // when
    wrapper.find('input').first().simulate('change', { target: { value: 'foo' } });

    // then
    expect(onChangeSpy).to.have.been.calledWith('foo');
  });


  it('#onClear', function() {

    // given
    const onChangeSpy = sinon.spy();

    const wrapper = mount(<Input value="foo" onChange={ onChangeSpy } />);

    // when
    wrapper.find('button').first().simulate('click');

    // then
    expect(onChangeSpy).to.have.been.calledWith('');
  });

});