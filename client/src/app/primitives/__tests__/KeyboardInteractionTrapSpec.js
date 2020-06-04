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
  mount
} from 'enzyme';

import KeyboardInteractionTrap,
{ KeyboardInteractionTrapContext } from './../modal/KeyboardInteractionTrap';


describe('<KeyboardInteractionTrap>', function() {

  let wrapper;

  afterEach(function() {
    if (wrapper && wrapper.exists()) {
      wrapper.unmount();
    }
  });


  it('should dispatch update-menu action', function() {

    // given
    const triggerAction = sinon.spy();

    // when
    wrapper = mount(
      <KeyboardInteractionTrapContext.Provider value={ triggerAction }>
        <KeyboardInteractionTrap />
      </KeyboardInteractionTrapContext.Provider>
    );

    // then
    expect(wrapper).to.exist;
    expect(triggerAction).to.have.been.calledOnce;
  });


  it('should NOT trigger error outside of context', function() {

    // when
    wrapper = mount(
      <KeyboardInteractionTrap />
    );

    // then
    expect(wrapper).to.exist;
  });
});
