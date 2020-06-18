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

import PingEventHandler from '../PingEventHandler';

const noop = () => {};

describe('<PingEventHandler>', () => {

  it('should send initially after enabling', () => {

    // given
    const onSend = sinon.spy();

    const pingEventHandler = new PingEventHandler({ onSend });

    pingEventHandler.setTimeout = noop;

    // when
    pingEventHandler.enable();

    // then
    expect(onSend).to.have.been.calledWith({ event: 'ping' });
  });


  it('should set interval after enabling', () => {

    // given
    const onSend = noop;

    const pingEventHandler = new PingEventHandler({ onSend });

    pingEventHandler.setInterval = sinon.spy();

    // when
    pingEventHandler.enable();

    // then
    expect(pingEventHandler.setInterval).to.have.been.called;
  });


  it('should clear interval after disabling', () => {

    // given
    const onSend = noop;

    const pingEventHandler = new PingEventHandler({ onSend });

    pingEventHandler.setInterval = noop;
    pingEventHandler.clearInterval = sinon.spy();

    // when
    pingEventHandler.enable();
    pingEventHandler.disable();

    // then
    expect(pingEventHandler.clearInterval).to.have.been.called;
  });


  it('should not send immediately after re-enabling', () => {

    // given
    const onSend = sinon.spy();

    const pingEventHandler = new PingEventHandler({ onSend });

    pingEventHandler.setInterval = noop;
    pingEventHandler.clearInterval = sinon.spy();

    // when
    pingEventHandler.enable();
    pingEventHandler.disable();
    pingEventHandler.enable();

    // then
    expect(onSend).to.have.been.calledOnce;
  });
});
