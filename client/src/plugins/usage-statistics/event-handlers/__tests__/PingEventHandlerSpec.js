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

import Flags from '../../../../util/Flags';

const noop = () => {};

describe('<PingEventHandler>', () => {

  let getGlobal;

  beforeEach(function() {
    getGlobal = () => ([ ]);
  });

  it('should send initially after enabling', async () => {

    // given
    const onSend = sinon.spy();

    const pingEventHandler = new PingEventHandler({ onSend, getGlobal });

    pingEventHandler.setTimeout = noop;

    // when
    pingEventHandler.enable();

    // then
    expect(onSend).to.have.been.calledWith({ event: 'ping', flags: {}, plugins: [] });
  });


  it('should set interval after enabling', async () => {

    // given
    const onSend = noop;

    const pingEventHandler = new PingEventHandler({ onSend, getGlobal });

    pingEventHandler.setInterval = sinon.stub().returns('testIntervalID');

    // when
    pingEventHandler.enable();

    // then
    expect(pingEventHandler.setInterval).to.have.been.called;
    expect(pingEventHandler._intervalID).to.eql('testIntervalID');
  });


  it('should clear interval after disabling', async () => {

    // given
    const onSend = noop;

    const pingEventHandler = new PingEventHandler({ onSend, getGlobal });

    pingEventHandler.setInterval = noop;
    pingEventHandler.clearInterval = sinon.spy();

    // when
    pingEventHandler.enable();
    pingEventHandler.disable();

    // then
    expect(pingEventHandler.clearInterval).to.have.been.called;
  });


  it('should not send immediately after re-enabling', async () => {

    // given
    const onSend = sinon.spy();

    const pingEventHandler = new PingEventHandler({ onSend, getGlobal });

    pingEventHandler.setInterval = noop;
    pingEventHandler.clearInterval = sinon.spy();

    // when
    pingEventHandler.enable();
    pingEventHandler.disable();
    pingEventHandler.enable();

    // then
    expect(onSend).to.have.been.calledOnce;
  });

  describe('metadata', function() {

    describe('plugins', function() {

      it('should send installed plugins', async () => {

        // given
        const onSend = sinon.spy();

        getGlobal = () => ({
          appPlugins: [ { name: 'pluginName' } ]
        });

        const pingEventHandler = new PingEventHandler({ onSend, getGlobal });

        pingEventHandler.setTimeout = noop;

        // when
        pingEventHandler.enable();

        // then
        expect(onSend).to.have.been.calledWith({ event: 'ping', flags: {}, plugins: [ 'pluginName' ] });
      });

    });


    describe('flags', function() {

      afterEach(function() {
        Flags.reset();
      });


      it('should send set flags', async () => {

        // given
        const onSend = sinon.spy();

        Flags.init({
          myFlag: true
        });

        const pingEventHandler = new PingEventHandler({ onSend, getGlobal });

        pingEventHandler.setTimeout = noop;

        // when
        pingEventHandler.enable();

        // then
        expect(onSend).to.have.been.calledWith({ event: 'ping', flags: { myFlag: true }, plugins: [] });
      });

    });

  });

});