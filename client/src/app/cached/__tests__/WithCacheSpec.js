/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { createRef } from 'react';

import { render } from '@testing-library/react';

import {
  Cache,
  WithCache
} from '..';


describe('WithCache', function() {

  it('should render', function() {

    // when
    const instance = renderWithCache();

    // then
    expect(instance).to.exist;
  });


  it('should pass cache', function() {

    // when
    const instance = renderWithCache();

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

function renderWithCache(options = {}) {
  const FooWithCache = WithCache(Foo);
  const ref = createRef();

  render(
    <FooWithCache
      ref={ ref }
      cache={ new Cache() }
    />
  );

  return ref.current;
}