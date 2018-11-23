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