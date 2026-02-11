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
import ConnectionEventHandler from '../ConnectionEventHandler';


describe('<ConnectionEventHandler>', function() {

  let subscribe, track;

  beforeEach(function() {

    subscribe = sinon.spy();

    track = sinon.spy();

    new ConnectionEventHandler({
      track,
      subscribe
    });

    MixpanelHandler.getInstance().enable('token', 'id', 'stage');
  });


  describe('should subscribe', function() {

    it('should subscribe to connectionManager.connectionStatusChanged', function() {

      // then
      expect(subscribe.getCall(0).args[0]).to.eql('connectionManager.connectionStatusChanged');
    });

  });


  describe('event tracking', function() {

    describe('should track status changes', function() {

      it('first successful check', function() {

        // given
        const handleStatusChanged = subscribe.getCall(0).args[1];

        // when
        handleStatusChanged({
          payload: {
            connectionId: 'conn-1',
            connection: createConnection({ contactPoint: 'http://localhost:8080', targetType: 'selfHosted' }),
            success: true,
            isLocal: true
          }
        });

        // then
        expect(track).to.have.been.calledOnce;
        expect(track).to.have.been.calledWith('connection:statusChanged', {
          success: true,
          targetType: 'Self-Managed',
          isLocal: true,
          reason: null
        });
      });


      it('first failed check', function() {

        // given
        const handleStatusChanged = subscribe.getCall(0).args[1];

        // when
        handleStatusChanged({
          payload: {
            connectionId: 'conn-1',
            connection: createConnection({ contactPoint: 'http://localhost:8080', targetType: 'selfHosted' }),
            success: false,
            reason: 'CONTACT_POINT_UNAVAILABLE',
            isLocal: true
          }
        });

        // then
        expect(track).to.have.been.calledOnce;
        expect(track).to.have.been.calledWith('connection:statusChanged', {
          success: false,
          targetType: 'Self-Managed',
          isLocal: true,
          reason: 'CONTACT_POINT_UNAVAILABLE'
        });
      });


      it('error to success transition', function() {

        // given
        const handleStatusChanged = subscribe.getCall(0).args[1];

        // first check - error
        handleStatusChanged({
          payload: {
            connectionId: 'conn-1',
            connection: createConnection({ contactPoint: 'http://localhost:8080', targetType: 'selfHosted' }),
            success: false,
            reason: 'CONTACT_POINT_UNAVAILABLE',
            isLocal: true
          }
        });

        // reset spy
        track.resetHistory();

        // when - second check - success
        handleStatusChanged({
          payload: {
            connectionId: 'conn-1',
            connection: createConnection({ contactPoint: 'http://localhost:8080', targetType: 'selfHosted' }),
            success: true,
            isLocal: true
          }
        });

        // then
        expect(track).to.have.been.calledOnce;
        expect(track).to.have.been.calledWith('connection:statusChanged', {
          success: true,
          targetType: 'Self-Managed',
          isLocal: true,
          reason: null
        });
      });


      it('success to error transition', function() {

        // given
        const handleStatusChanged = subscribe.getCall(0).args[1];

        // first check - success
        handleStatusChanged({
          payload: {
            connectionId: 'conn-1',
            connection: createConnection({ contactPoint: 'http://localhost:8080', targetType: 'selfHosted' }),
            success: true,
            isLocal: true
          }
        });

        // reset spy
        track.resetHistory();

        // when - second check - error
        handleStatusChanged({
          payload: {
            connectionId: 'conn-1',
            connection: createConnection({ contactPoint: 'http://localhost:8080', targetType: 'selfHosted' }),
            success: false,
            reason: 'UNAUTHORIZED',
            isLocal: true
          }
        });

        // then
        expect(track).to.have.been.calledOnce;
        expect(track).to.have.been.calledWith('connection:statusChanged', {
          success: false,
          targetType: 'Self-Managed',
          isLocal: true,
          reason: 'UNAUTHORIZED'
        });
      });


      it('connection switch (success to success)', function() {

        // given
        const handleStatusChanged = subscribe.getCall(0).args[1];

        // first connection - success
        handleStatusChanged({
          payload: {
            connectionId: 'conn-1',
            connection: createConnection({ contactPoint: 'http://localhost:8080', targetType: 'selfHosted' }),
            success: true,
            isLocal: true
          }
        });

        // reset spy
        track.resetHistory();

        // when - switch to different connection - also success
        handleStatusChanged({
          payload: {
            connectionId: 'conn-2',
            connection: createConnection({ camundaCloudClusterUrl: 'https://foo.jfk-1.zeebe.camunda.io', targetType: 'camundaCloud' }),
            success: true,
            isLocal: false
          }
        });

        // then
        expect(track).to.have.been.calledOnce;
        expect(track).to.have.been.calledWith('connection:statusChanged', {
          success: true,
          targetType: 'SaaS',
          isLocal: false,
          reason: null
        });
      });

    });


    describe('should NOT track duplicate events', function() {

      it('continuous success on same connection', function() {

        // given
        const handleStatusChanged = subscribe.getCall(0).args[1];

        // first check - success
        handleStatusChanged({
          payload: {
            connectionId: 'conn-1',
            connection: createConnection({ contactPoint: 'http://localhost:8080', targetType: 'selfHosted' }),
            success: true,
            isLocal: true
          }
        });

        // reset spy
        track.resetHistory();

        // when - second check - still success
        handleStatusChanged({
          payload: {
            connectionId: 'conn-1',
            connection: createConnection({ contactPoint: 'http://localhost:8080', targetType: 'selfHosted' }),
            success: true,
            isLocal: true
          }
        });

        // then
        expect(track).not.to.have.been.called;
      });


      it('continuous failure on same connection', function() {

        // given
        const handleStatusChanged = subscribe.getCall(0).args[1];

        // first check - error
        handleStatusChanged({
          payload: {
            connectionId: 'conn-1',
            connection: createConnection({ contactPoint: 'http://localhost:8080', targetType: 'selfHosted' }),
            success: false,
            reason: 'CONTACT_POINT_UNAVAILABLE',
            isLocal: true
          }
        });

        // reset spy
        track.resetHistory();

        // when - second check - still error
        handleStatusChanged({
          payload: {
            connectionId: 'conn-1',
            connection: createConnection({ contactPoint: 'http://localhost:8080', targetType: 'selfHosted' }),
            success: false,
            reason: 'CONTACT_POINT_UNAVAILABLE',
            isLocal: true
          }
        });

        // then
        expect(track).not.to.have.been.called;
      });

    });


    describe('should NOT track invalid events', function() {

      it('no payload', function() {

        // given
        const handleStatusChanged = subscribe.getCall(0).args[1];

        // when
        handleStatusChanged({});

        // then
        expect(track).not.to.have.been.called;
      });


      it('no connection', function() {

        // given
        const handleStatusChanged = subscribe.getCall(0).args[1];

        // when
        handleStatusChanged({
          payload: {
            connectionId: 'conn-1',
            connection: null,
            success: true
          }
        });

        // then
        expect(track).not.to.have.been.called;
      });


      it('no connectionId', function() {

        // given
        const handleStatusChanged = subscribe.getCall(0).args[1];

        // when
        handleStatusChanged({
          payload: {
            connection: createConnection({ contactPoint: 'http://localhost:8080', targetType: 'selfHosted' }),
            success: true,
            isLocal: true
          }
        });

        // then
        expect(track).not.to.have.been.called;
      });


      it('NO_CONNECTION id', function() {

        // given
        const handleStatusChanged = subscribe.getCall(0).args[1];

        // when
        handleStatusChanged({
          payload: {
            connectionId: 'NO_CONNECTION',
            connection: { id: 'NO_CONNECTION', name: 'No connection' },
            success: false,
            isLocal: false
          }
        });

        // then
        expect(track).not.to.have.been.called;
      });

    });

  });


  describe('target type detection', function() {

    it('SaaS gRPC connection', function() {

      // given
      const handleStatusChanged = subscribe.getCall(0).args[1];

      // when
      handleStatusChanged({
        payload: {
          connectionId: 'conn-1',
          connection: createConnection({ camundaCloudClusterUrl: 'https://foo.jfk-1.zeebe.camunda.io', targetType: 'camundaCloud' }),
          success: true,
          isLocal: false
        }
      });

      // then
      expect(track).to.have.been.calledWith('connection:statusChanged', {
        targetType: 'SaaS',
        isLocal: false,
        success: true,
        reason: null
      });
    });


    it('Self-Managed local connection (c8run)', function() {

      // given
      const handleStatusChanged = subscribe.getCall(0).args[1];

      // when
      handleStatusChanged({
        payload: {
          connectionId: 'conn-1',
          connection: createConnection({ contactPoint: 'http://localhost:8080/v2', targetType: 'selfHosted' }),
          success: false,
          reason: 'CONTACT_POINT_UNAVAILABLE',
          isLocal: true
        }
      });

      // then
      expect(track).to.have.been.calledWith('connection:statusChanged', {
        targetType: 'Self-Managed',
        isLocal: true,
        reason: 'CONTACT_POINT_UNAVAILABLE',
        success: false
      });
    });

  });


  it('connection without endpoint (isLocal should be null)', function() {

    // given
    const handleStatusChanged = subscribe.getCall(0).args[1];

    // when
    handleStatusChanged({
      payload: {
        connectionId: 'conn-1',
        connection: createConnection({ targetType: 'selfHosted' }), // no contactPoint
        success: false,
        reason: 'UNAUTHORIZED',
        isLocal: null
      }
    });

    // then
    expect(track).to.have.been.calledWith('connection:statusChanged', {
      targetType: 'Self-Managed',
      isLocal: null,
      reason: 'UNAUTHORIZED',
      success: false
    });
  });

});


// helpers ///////////////

function createConnection(overrides = {}) {
  return {
    id: 'conn-1',
    name: 'Test Connection',
    ...overrides
  };
}
