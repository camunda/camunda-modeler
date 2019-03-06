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

import {
  CachedComponent
} from '..';

const spy = sinon.spy;


describe('<CachedComponent>', function() {

  it('should render', function() {

    // when
    const instance = render();

    // then
    expect(instance).to.exist;
  });


  describe('props', function() {

    it('cachedState', function() {

      // given
      const instance = render({
        cachedState: {
          foo: 'foo'
        }
      });

      // when
      const cachedState = instance.props.cachedState;

      // then
      expect(cachedState).to.eql({
        foo: 'foo'
      });
    });


    it('setCachedState', function() {

      // given
      const setCachedStateSpy = spy();

      const instance = render({
        setCachedState: setCachedStateSpy
      });

      // when
      instance.props.setCachedState('foo');

      // then
      expect(setCachedStateSpy).to.have.been.calledWith('foo');
    });

  });

});

// helpers //////////

function noop() {}

class Foo extends CachedComponent {
  render() {
    return <div>Foo</div>;
  }
}

function render(options = {}) {
  const wrapper = mount(<Foo
    cachedState={ options.cachedState || {} }
    setCachedState={ options.setCachedState || noop } />);

  return wrapper.find(Foo).instance();
}