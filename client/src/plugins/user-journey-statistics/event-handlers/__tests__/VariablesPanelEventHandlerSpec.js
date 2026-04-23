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


  it('should subscribe to layout.changed', function() {

    // then
    expect(subscribe.calledOnce).to.be.true;
    expect(subscribe.getCall(0).args[0]).to.eql('layout.changed');
  });


  it('should track panel opened', function() {

    // given
    const callback = subscribe.getCall(0).args[1];

    // when
    callback({
      prevLayout: { variablesSidePanel: { open: false } },
      layout: { variablesSidePanel: { open: true } }
    });

    // then
    expect(track).to.have.been.calledWith(VARIABLE_OUTLINE_OPENED_EVENT_NAME);
  });


  it('should track panel closed', function() {

    // given
    const callback = subscribe.getCall(0).args[1];

    // when
    callback({
      prevLayout: { variablesSidePanel: { open: true } },
      layout: { variablesSidePanel: { open: false } }
    });

    // then
    expect(track).to.have.been.calledWith(VARIABLE_OUTLINE_CLOSED_EVENT_NAME);
  });


  it('should NOT track when open state is unchanged', function() {

    // given
    const callback = subscribe.getCall(0).args[1];

    // when
    callback({
      prevLayout: { variablesSidePanel: { open: true, width: 280 } },
      layout: { variablesSidePanel: { open: true, width: 350 } }
    });

    // then
    expect(track).not.to.have.been.called;
  });


  it('should NOT track when layout has no variablesSidePanel', function() {

    // given
    const callback = subscribe.getCall(0).args[1];

    // when
    callback({
      prevLayout: { panel: { open: true } },
      layout: { panel: { open: false } }
    });

    // then
    expect(track).not.to.have.been.called;
  });


  it('should use default open state when variablesSidePanel is not set', function() {

    // given
    const callback = subscribe.getCall(0).args[1];

    // when
    callback({
      prevLayout: {},
      layout: { variablesSidePanel: { open: false } }
    });

    // then
    expect(track).to.have.been.calledWith(VARIABLE_OUTLINE_CLOSED_EVENT_NAME);
  });

});
