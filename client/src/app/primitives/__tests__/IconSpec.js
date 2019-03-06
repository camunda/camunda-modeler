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

import { shallow } from 'enzyme';

import { Icon } from '..';


describe('<Icon>', function() {

  it('should render', function() {
    shallow(<Icon />);
  });


  it('should accept custom className', function() {

    // when
    const wrapper = shallow(<Icon className="foo" />);

    // then
    expect(wrapper.hasClass('foo')).to.be.true;
  });

});