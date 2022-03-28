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

  let config = {
    get: () => {}
  };

  it('should send initially after enabling', async () => {

    // given
    const onSend = sinon.spy();

    const pingEventHandler = new PingEventHandler({ onSend, config });

    pingEventHandler.setTimeout = noop;

    // when
    await pingEventHandler.enable();

    // then
    expect(onSend).to.have.been.calledWith({ event: 'ping', plugins: [] });
  });


  it('should set interval after enabling', async () => {

    // given
    const onSend = noop;

    const pingEventHandler = new PingEventHandler({ onSend, config });

    pingEventHandler.setInterval = sinon.stub().returns('testIntervalID');

    // when
    await pingEventHandler.enable();

    // then
    expect(pingEventHandler.setInterval).to.have.been.called;
    expect(pingEventHandler._intervalID).to.eql('testIntervalID');
  });


  it('should clear interval after disabling', async () => {

    // given
    const onSend = noop;

    const pingEventHandler = new PingEventHandler({ onSend, config });

    pingEventHandler.setInterval = noop;
    pingEventHandler.clearInterval = sinon.spy();

    // when
    await pingEventHandler.enable();
    pingEventHandler.disable();

    // then
    expect(pingEventHandler.clearInterval).to.have.been.called;
  });


  it('should not send immediately after re-enabling', async () => {

    // given
    const onSend = sinon.spy();

    const pingEventHandler = new PingEventHandler({ onSend, config });

    pingEventHandler.setInterval = noop;
    pingEventHandler.clearInterval = sinon.spy();

    // when
    await pingEventHandler.enable();
    pingEventHandler.disable();
    await pingEventHandler.enable();

    // then
    expect(onSend).to.have.been.calledOnce;
  });


  it('should send installed plugins', async () => {

    // given
    const onSend = sinon.spy();

    config = {
      get: () => new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve({ pluginName: {} });
        }, 1000);
      })
    };

    const pingEventHandler = new PingEventHandler({ onSend, config });

    pingEventHandler.setTimeout = noop;

    // when
    await pingEventHandler.enable();

    // then

    expect(onSend).to.have.been.calledWith({ event: 'ping', plugins: [ 'pluginName' ] });
  });
});