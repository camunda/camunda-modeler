/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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