/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { expect } from 'chai';
import React, { createRef } from 'react';

import { render, waitFor } from '@testing-library/react';

import {
  Cache,
  CachedComponent,
  WithCachedState
} from '..';


describe('WithCachedState', function() {

  it('should render', function() {

    // when
    const instance = renderWithCachedState();

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

    const instance = renderWithCachedState({ cache });

    // when
    const cachedState = instance.getCached();

    // then
    expect(cachedState).to.eql({
      foo: 'foo'
    });
  });


  it('#setCached', async function() {

    // given
    const instance = renderWithCachedState();

    // when
    instance.setCached({
      foo: 'foo'
    });

    // then
    await waitFor(() => {
      expect(instance.getCached()).to.eql({
        foo: 'foo'
      });
    });
  });


  it('#setCached -> #setCached', async function() {

    // given
    const instance = renderWithCachedState();

    // when
    instance.setCached({
      foo: 'foo'
    });

    instance.setCached({
      bar: 'bar'
    });

    // then
    await waitFor(() => {
      expect(instance.getCached()).to.eql({
        foo: 'foo',
        bar: 'bar'
      });
    });
  });


  it('should persist #setCached even when unmounted before flush', function() {

    // given
    const cache = new Cache();

    const { instance, unmount } = renderWithCachedStateAndUnmount({ cache });

    // when
    // setCached, then unmount before React flushes (e.g. a fast tab switch)
    instance.setCached({ foo: 'foo' });

    unmount();

    // then
    expect(cache.get('foo').cached).to.eql({ foo: 'foo' });
  });

});

function renderWithCachedStateAndUnmount(options = {}) {
  const FooWithCachedState = WithCachedState(Foo);
  const ref = createRef();

  const { unmount } = render(
    <FooWithCachedState
      ref={ ref }
      id="foo"
      cache={ options.cache || new Cache() }
    />
  );

  return { instance: ref.current, unmount };
}

// helpers //////////

class Foo extends CachedComponent {
  render() {
    return <div>Foo</div>;
  }
}

function renderWithCachedState(options = {}) {
  return renderWithCachedStateAndUnmount(options).instance;
}