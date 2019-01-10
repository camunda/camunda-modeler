import React from 'react';

import { mount } from 'enzyme';

import {
  Cache,
  CachedComponent,
  WithCachedState
} from '..';


describe('WithCachedState', function() {

  it('should render', function() {

    // when
    const instance = render();

    // then
    expect(instance).to.exist;
  });


  it('#getCached', function() {

    // given
    const cache = new Cache();

    cache.add('foo', {
      cached: {
        foo: 'foo'
      }
    });

    const instance = render({ cache });

    // when
    const cachedState = instance.getCached();

    // then
    expect(cachedState).to.eql({
      foo: 'foo'
    });
  });


  it('#setCached', function() {

    // given
    const instance = render();

    // when
    instance.setCached({
      foo: 'foo'
    });

    // then
    expect(instance.getCached()).to.eql({
      foo: 'foo'
    });
  });


  it('#setCached -> #setCached', function() {

    // given
    const instance = render();

    // when
    instance.setCached({
      foo: 'foo'
    });

    instance.setCached({
      bar: 'bar'
    });

    // then
    expect(instance.getCached()).to.eql({
      foo: 'foo',
      bar: 'bar'
    });
  });

});

// helpers //////////

class Foo extends CachedComponent {
  render() {
    return <div>Foo</div>;
  }
}

function render(options = {}) {
  const FooWithCachedState = WithCachedState(Foo);

  const wrapper = mount(<FooWithCachedState
    id="foo"
    cache={ options.cache || new Cache() } />);

  return wrapper.find(Foo).instance();
}