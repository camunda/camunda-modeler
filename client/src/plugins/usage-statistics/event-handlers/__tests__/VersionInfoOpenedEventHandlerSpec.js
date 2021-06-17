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

import VersionInfoOpenedEventHandler from '../VersionInfoOpenedEventHandler';

const noop = () => {};

describe('<VersionInfoOpenedEventHandler>', () => {

  it('should subscribe to versionInfo.opened', () => {

    // given
    const onSend = sinon.spy();
    const subscribe = createSubscribe();
    const handler = new VersionInfoOpenedEventHandler({ onSend, subscribe });
    handler.enable();

    // when
    subscribe.emit({ source: 'statusBar' });

    // then
    expect(onSend).to.have.been.calledOnceWith({ event: 'versionInfoOpened', source: 'statusBar' });
  });


  it('should pass the source name', () => {

    // given
    const onSend = sinon.spy();
    const subscribe = createSubscribe();
    const handler = new VersionInfoOpenedEventHandler({ onSend, subscribe });
    handler.enable();

    // when
    subscribe.emit({ source: 'menu' });

    // then
    expect(onSend).to.have.been.calledOnceWith({ event: 'versionInfoOpened', source: 'menu' });
  });


  it('should unsubscribe when handler is disabled', () => {

    // given
    const onSend = sinon.spy();
    const subscribe = createSubscribe();
    const handler = new VersionInfoOpenedEventHandler({ onSend, subscribe });
    handler.enable();

    // when
    handler.disable();
    subscribe.emit({ source: 'menu' });

    // then
    expect(onSend).not.to.have.been.called;
    expect(subscribe.getListener()).to.eql(noop);
  });
});

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
  subscribe.getListener = () => cb;

  return subscribe;
}
