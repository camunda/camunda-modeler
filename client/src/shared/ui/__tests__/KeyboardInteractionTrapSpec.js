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

import {
  render,
  cleanup
} from '@testing-library/react';

import KeyboardInteractionTrap,
{ KeyboardInteractionTrapContext } from '../trap/KeyboardInteractionTrap';


describe('<KeyboardInteractionTrap>', function() {

  afterEach(cleanup);


  it('should dispatch update-menu action', function() {

    // given
    const triggerAction = sinon.spy();

    // when
    const { container } = render(
      <KeyboardInteractionTrapContext.Provider value={ triggerAction }>
        <KeyboardInteractionTrap />
      </KeyboardInteractionTrapContext.Provider>
    );

    // then
    expect(container).to.exist;
    expect(triggerAction).to.have.been.calledOnce;
  });


  it('should NOT trigger error outside of context', function() {

    // when
    const { container } = render(
      <KeyboardInteractionTrap />
    );

    // then
    expect(container).to.exist;
  });
});
