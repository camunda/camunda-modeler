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

import { shallow } from 'enzyme';

import { Button } from '..';


describe('<Button>', function() {

  it('should render', function() {
    shallow(<Button />);
  });


  it('should accept custom className', function() {

    // when
    const wrapper = shallow(<Button className="foo" />);

    // then
    expect(wrapper.hasClass('foo')).to.be.true;
  });


  it('should handle passed onClick prop', function() {

    // given
    const spy = sinon.spy();

    const wrapper = shallow(<Button onClick={ spy } />);

    // when
    wrapper.simulate('click');

    // then
    expect(spy).to.have.been.called;
  });


  it('should be disabled', function() {

    // when
    const wrapper = shallow(<Button disabled />);

    // then
    expect(wrapper.hasClass('disabled')).to.be.true;
  });

});