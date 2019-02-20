/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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