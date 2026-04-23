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

import MixpanelHandler from '../../MixpanelHandler';

import {
  VARIABLE_OUTLINE_OPENED_EVENT_NAME,
  VARIABLE_OUTLINE_CLOSED_EVENT_NAME,
  default as VariablesPanelEventHandler
} from '../VariablesPanelEventHandler';


describe('<VariablesPanelEventHandler>', function() {

  let subscribe, track;

  beforeEach(function() {

    subscribe = sinon.spy();

    track = sinon.spy();

    new VariablesPanelEventHandler({
      track,
      subscribe
    });

    MixpanelHandler.getInstance().enable('token', 'id', 'stage');
  });


  it('should subscribe to variableOutline:layoutChanged', function() {

    // then
    expect(subscribe.calledOnce).to.be.true;
    expect(subscribe.getCall(0).args[0]).to.eql('variableOutline:layoutChanged');
  });


  it('should track panel opened', function() {

    // given
    const callback = subscribe.getCall(0).args[1];

    // when
    callback({ open: true });

    // then
    expect(track).to.have.been.calledWith(VARIABLE_OUTLINE_OPENED_EVENT_NAME);
  });


  it('should track panel closed', function() {

    // given
    const callback = subscribe.getCall(0).args[1];

    // when
    callback({ open: false });

    // then
    expect(track).to.have.been.calledWith(VARIABLE_OUTLINE_CLOSED_EVENT_NAME);
  });

});
