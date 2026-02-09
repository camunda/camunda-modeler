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

import React, { createRef } from 'react';

import { render } from '@testing-library/react';

import {
  CachedComponent
} from '..';

const spy = sinon.spy;


describe('<CachedComponent>', function() {

  it('should render', function() {

    // when
    const instance = renderCachedComponent();

    // then
    expect(instance).to.exist;
  });


  describe('props', function() {

    it('cachedState', function() {

      // given
      const instance = renderCachedComponent({
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

      const instance = renderCachedComponent({
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

function renderCachedComponent(options = {}) {
  const ref = createRef();

  render(
    <Foo
      ref={ ref }
      cachedState={ options.cachedState || {} }
      setCachedState={ options.setCachedState || noop }
    />
  );

  return ref.current;
}