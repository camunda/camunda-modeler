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
import PingEventHandler from '../PingEventHandler';

import Flags from '../../../../util/Flags';


describe('<PingEventHandlerSpec>', function() {

  let track = sinon.spy();
  const subscribe = sinon.spy();

  beforeEach(function() {
    const getGlobal = () => ({
      appPlugins: [ { name: 'pluginName' } ]
    });

    new PingEventHandler({ track, getGlobal, subscribe });

    MixpanelHandler.getInstance().enable('token', 'id', 'stage');
  });

  afterEach(sinon.restore);


  describe('should subscribe', function() {

    it('should subscribe to telemetry.enabled', function() {
      expect(subscribe.getCall(0).args[0]).to.eql('telemetry.enabled');
    });


    it('should subscribe to telemetry.disabled', function() {
      expect(subscribe.getCall(1).args[0]).to.eql('telemetry.disabled');
    });

  });


  describe('should send', function() {

    it('should not send before enabled', async function() {

      // then
      expect(track).to.not.have.been.called;
    });


    it('should send initially', async function() {

      // given
      const handleTelemetryActivation = subscribe.getCall(0).args[1];

      // when
      await handleTelemetryActivation();

      // then
      expect(track).to.have.been.called;
    });


    it('should send on interval', async function() {

      // given
      const clock = sinon.useFakeTimers();
      const handleTelemetryActivation = subscribe.getCall(0).args[1];

      // when
      await handleTelemetryActivation();
      clock.tick(1000);

      // then
      expect(track).to.have.been.calledOnce;
      clock.restore();
    });

  });


  describe('plugins', function() {

    it('should send installed plugins', async function() {

      // given
      const handleTelemetryActivation = subscribe.getCall(0).args[1];

      // when
      await handleTelemetryActivation();

      // then
      expect(track).to.have.been.calledWith('ping', {
        flags: {},
        plugins: [ 'pluginName' ]
      });
    });
  });


  describe('flags', function() {

    let track;

    const handlePing = async () => {
      track = sinon.spy();
      const subscribe = sinon.spy();

      new PingEventHandler({ track, getGlobal: () => ({}), subscribe });
      const handleTelemetryActivation = subscribe.getCall(0).args[1];

      await handleTelemetryActivation();
    };

    afterEach(function() {
      Flags.reset();
    });

    it('should send set flags', async function() {

      // given
      Flags.init({
        myFlagA: true,
        myFlagB: false
      });

      // when
      await handlePing();

      // then
      expect(track).to.have.been.calledWith('ping', {
        flags: {
          myFlagA: true,
          myFlagB: false
        },
        plugins: []
      });
    });


    it('should mask non-boolean flags', async function() {

      // given
      Flags.init({
        flagWithPrivateDataSet: 'my/custom/filepath'
      });

      // when
      await handlePing();

      // then
      expect(track).to.have.been.calledWith('ping', {
        flags: { flagWithPrivateDataSet: true },
        plugins: []
      });
    });


    it('should not overwrite original Flags through masking', async function() {

      // given
      Flags.init({
        flagWithPrivateDataSet: 'my/custom/filepath'
      });

      // when
      await handlePing();

      // then
      expect(Flags.data.flagWithPrivateDataSet).to.eql('my/custom/filepath');
    });

  });

});