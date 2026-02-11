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

import { render, fireEvent, screen } from '@testing-library/react';

import { CreateNewAction } from '../CreateNewAction';

const DEFAULT_ITEMS = [ { text: 'foo' }, { text: 'bar' } ];


describe('<CreateNewAction>', function() {

  it('should render', function() {
    expect(createTabAction).not.to.throw();
  });


  it('should open', function() {

    // given
    createTabAction();

    // when
    fireEvent.click(screen.getByRole('button'));

    // then
    expect(screen.getByRole('button', { name: 'foo' })).to.exist;
    expect(screen.getByRole('button', { name: 'bar' })).to.exist;
  });


  it('should render items per group', function() {

    // given
    const newFileItems = [
      { key: 'A', items: [ ...DEFAULT_ITEMS ] },
      { key: 'B', items: [ ...DEFAULT_ITEMS ] },
      { key: 'C', items: [ ...DEFAULT_ITEMS ] }
    ];

    createTabAction({ newFileItems });

    // when
    fireEvent.click(screen.getByRole('button'));

    // then
    const sections = screen.getAllByRole('menu');
    expect(sections).to.have.length(3);
  });


  it('should open via event', function() {

    // given
    const subscribe = createSubscribe();

    const spy = sinon.spy();

    const {
      instance
    } = createTabAction({ subscribe });

    instance.current.open = spy;

    // when
    subscribe.emit();

    // then
    expect(spy).to.have.been.called;
  });

});


// helpers /////////////////////////////////////

function createTabAction(options = {}) {
  const {
    newFileItems,
    subscribe
  } = options;

  const ref = createRef();

  const { container } = render(
    <CreateNewAction
      ref={ ref }
      newFileItems={ newFileItems || DEFAULT_ITEMS }
      subscribe={ subscribe || createSubscribe() } />
  );

  return {
    container,
    instance: ref
  };
}

function noop() {}

function createSubscribe() {

  let cb = noop;

  function subscribe(_, callback) {
    cb = callback;

    return {
      cancel() {
        cb = noop;
      }
    };
  }

  subscribe.emit = (payload) => cb(payload);

  return subscribe;
}