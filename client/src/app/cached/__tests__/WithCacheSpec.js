import React from 'react';

import { mount } from 'enzyme';

import {
  Cache,
  WithCache
} from '..';


describe('WithCache', function() {

  it('should render', function() {

    // when
    const instance = render();

    // then
    expect(instance).to.exist;
  });


  it('should pass cache', function() {

    // when
    const instance = render();

    // then
    expect(instance.props.cache).to.exist;
  });

});

// helpers //////////

class Foo extends React.Component {
  render() {
    return <div>Foo</div>;
  }
}

function render(options = {}) {
  const FooWithCache = WithCache(Foo);

  const wrapper = mount(<FooWithCache cache={ new Cache() } />);

  return wrapper.find(Foo).instance();
}