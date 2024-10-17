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
import OverlayEventHandler from '../OverlayEventHandler';

import emptyXML from './fixtures/empty.bpmn';
import emptyDMN from './fixtures/empty.dmn';

import engineProfileXML from './fixtures/engine-profile.bpmn';
import engineProfileDMN from './fixtures/engine-platform.dmn';

import engineProfileCloudXML from './fixtures/engine-cloud.bpmn';
import engineProfileCloudDMN from './fixtures/engine-cloud.dmn';

describe('<OverlayEventHandler>', function() {

  let subscribe, track;

  beforeEach(function() {

    subscribe = sinon.spy();

    track = sinon.spy();

    new OverlayEventHandler({
      track,
      subscribe
    });

    MixpanelHandler.getInstance().enable('token', 'id', 'stage');
  });


  describe('should subscribe', function() {

    it('should subscribe to deployment.opened', function() {
      expect(subscribe.getCall(0).args[0]).to.eql('deployment.opened');
    });


    it('should subscribe to deployment.closed', function() {
      expect(subscribe.getCall(1).args[0]).to.eql('deployment.closed');
    });


    it('should subscribe to versionInfo.opened', function() {
      expect(subscribe.getCall(2).args[0]).to.eql('versionInfo.opened');
    });

  });


  describe('deploy overlay', function() {

    describe('should send for type', function() {

      describe('deployment.opened', function() {

        describe('deployment tool', function() {

          it('bpmn', async function() {

            // given
            const tab = createTab({
              type: 'bpmn'
            });

            const handleOverlayAction = subscribe.getCall(0).args[1];

            // when
            await handleOverlayAction({
              tab,
              context: 'deploymentTool'
            });

            // then
            expect(track).to.have.been.calledWith('overlay:deploy:opened', {
              diagramType: 'bpmn'
            });
          });


          it('cloud bpmn', async function() {

            // given
            const tab = createTab({
              type: 'cloud-bpmn'
            });

            const handleOverlayAction = subscribe.getCall(0).args[1];

            // when
            await handleOverlayAction({
              tab,
              context: 'deploymentTool'
            });

            // then
            expect(track).to.have.been.calledWith('overlay:deploy:opened', {
              diagramType: 'bpmn'
            });
          });


          it('dmn', async function() {

            // given
            const tab = createTab({
              type: 'dmn'
            });

            const handleOverlayAction = subscribe.getCall(0).args[1];

            // when
            await handleOverlayAction({
              tab,
              context: 'deploymentTool'
            });

            // then
            expect(track).to.have.been.calledWith('overlay:deploy:opened', {
              diagramType: 'dmn'
            });
          });


          it('cloud dmn', async function() {

            // given
            const tab = createTab({
              type: 'cloud-dmn'
            });

            const handleOverlayAction = subscribe.getCall(0).args[1];

            // when
            await handleOverlayAction({
              tab,
              context: 'deploymentTool'
            });

            // then
            expect(track).to.have.been.calledWith('overlay:deploy:opened', {
              diagramType: 'dmn'
            });

          });

        });


        describe('start instance tool', function() {

          it('bpmn', async function() {

            // given
            const tab = createTab({
              type: 'bpmn'
            });

            const handleOverlayAction = subscribe.getCall(0).args[1];

            // when
            await handleOverlayAction({
              tab,
              context: 'startInstanceTool'
            });

            // then
            expect(track).to.have.been.calledWith('overlay:startInstance:opened', {
              diagramType: 'bpmn'
            });
          });


          it('cloud bpmn', async function() {

            // given
            const tab = createTab({
              type: 'cloud-bpmn'
            });

            const handleOverlayAction = subscribe.getCall(0).args[1];

            // when
            await handleOverlayAction({
              tab,
              context: 'startInstanceTool'
            });

            // then
            expect(track).to.have.been.calledWith('overlay:startInstance:opened', {
              diagramType: 'bpmn'
            });
          });


          it('dmn', async function() {

            // given
            const tab = createTab({
              type: 'dmn'
            });

            const handleOverlayAction = subscribe.getCall(0).args[1];

            // when
            await handleOverlayAction({
              tab,
              context: 'startInstanceTool'
            });

            // then
            expect(track).to.have.been.calledWith('overlay:startInstance:opened', {
              diagramType: 'dmn'
            });
          });


          it('cloud dmn', async function() {

            // given
            const tab = createTab({
              type: 'cloud-dmn'
            });

            const handleOverlayAction = subscribe.getCall(0).args[1];

            // when
            await handleOverlayAction({
              tab,
              context: 'startInstanceTool'
            });

            // then
            expect(track).to.have.been.calledWith('overlay:startInstance:opened', {
              diagramType: 'dmn'
            });
          });

        });

      });


      describe('deployment.closed', function() {

        describe('deployment tool', function() {

          it('bpmn', async function() {

            // given
            const tab = createTab({
              type: 'bpmn'
            });

            const handleOverlayAction = subscribe.getCall(1).args[1];

            // when
            await handleOverlayAction({
              tab,
              context: 'deploymentTool'
            });

            // then
            expect(track).to.have.been.calledWith('overlay:deploy:closed', {
              diagramType: 'bpmn'
            });
          });


          it('cloud bpmn', async function() {

            // given
            const tab = createTab({
              type: 'cloud-bpmn'
            });

            const handleOverlayAction = subscribe.getCall(1).args[1];

            // when
            await handleOverlayAction({
              tab,
              context: 'deploymentTool'
            });

            // then
            expect(track).to.have.been.calledWith('overlay:deploy:closed', {
              diagramType: 'bpmn'
            });
          });


          it('dmn', async function() {

            // given
            const tab = createTab({
              type: 'dmn'
            });

            const handleOverlayAction = subscribe.getCall(1).args[1];

            // when
            await handleOverlayAction({
              tab,
              context: 'deploymentTool'
            });

            // then
            expect(track).to.have.been.calledWith('overlay:deploy:closed', {
              diagramType: 'dmn'
            });
          });


          it('cloud dmn', async function() {

            // given
            const tab = createTab({
              type: 'cloud-dmn'
            });

            const handleOverlayAction = subscribe.getCall(1).args[1];

            // when
            await handleOverlayAction({
              tab,
              context: 'deploymentTool'
            });

            // then
            expect(track).to.have.been.calledWith('overlay:deploy:closed', {
              diagramType: 'dmn'
            });

          });

        });


        describe('start instance tool', function() {

          it('bpmn', async function() {

            // given
            const tab = createTab({
              type: 'bpmn'
            });

            const handleOverlayAction = subscribe.getCall(1).args[1];

            // when
            await handleOverlayAction({
              tab,
              context: 'startInstanceTool'
            });

            // then
            expect(track).to.have.been.calledWith('overlay:startInstance:closed', {
              diagramType: 'bpmn'
            });
          });


          it('cloud bpmn', async function() {

            // given
            const tab = createTab({
              type: 'cloud-bpmn'
            });

            const handleOverlayAction = subscribe.getCall(1).args[1];

            // when
            await handleOverlayAction({
              tab,
              context: 'startInstanceTool'
            });

            // then
            expect(track).to.have.been.calledWith('overlay:startInstance:closed', {
              diagramType: 'bpmn'
            });
          });


          it('dmn', async function() {

            // given
            const tab = createTab({
              type: 'dmn'
            });

            const handleOverlayAction = subscribe.getCall(1).args[1];

            // when
            await handleOverlayAction({
              tab,
              context: 'startInstanceTool'
            });

            // then
            expect(track).to.have.been.calledWith('overlay:startInstance:closed', {
              diagramType: 'dmn'
            });
          });


          it('cloud dmn', async function() {

            // given
            const tab = createTab({
              type: 'cloud-dmn'
            });

            const handleOverlayAction = subscribe.getCall(1).args[1];

            // when
            await handleOverlayAction({
              tab,
              context: 'startInstanceTool'
            });

            // then
            expect(track).to.have.been.calledWith('overlay:startInstance:closed', {
              diagramType: 'dmn'
            });
          });

        });

      });
    });


    describe('should send engine profile', function() {

      describe('set engine profile', function() {

        it('bpmn', async function() {

          // given
          const tab = createTab({
            type: 'bpmn',
            file: {
              contents: engineProfileXML
            }
          });

          const handleOverlayAction = subscribe.getCall(0).args[1];

          // when
          await handleOverlayAction({ tab });

          const { executionPlatform, executionPlatformVersion } = track.getCall(0).args[1];

          // then
          expect(executionPlatform).to.eql('Camunda Platform');
          expect(executionPlatformVersion).to.eql('7.15.0');

        });


        it('cloud bpmn', async function() {

          // given
          const tab = createTab({
            type: 'cloud-bpmn',
            file: {
              contents: engineProfileCloudXML
            }
          });

          const handleOverlayAction = subscribe.getCall(0).args[1];

          // when
          await handleOverlayAction({ tab });

          const { executionPlatform } = track.getCall(0).args[1];

          // then
          expect(executionPlatform).to.eql('Camunda Cloud');

        });


        it('dmn', async function() {

          // given
          const tab = createTab({
            type: 'dmn',
            file: {
              contents: engineProfileDMN
            }
          });

          const handleOverlayAction = subscribe.getCall(0).args[1];

          // when
          await handleOverlayAction({ tab });

          const { executionPlatform, executionPlatformVersion } = track.getCall(0).args[1];

          // then
          expect(executionPlatform).to.eql('Camunda Platform');
          expect(executionPlatformVersion).to.eql('7.16.0');


        });


        it('cloud dmn', async function() {

          // given
          const tab = createTab({
            type: 'cloud-dmn',
            file: {
              contents: engineProfileCloudDMN
            }
          });

          const handleOverlayAction = subscribe.getCall(0).args[1];

          // when
          await handleOverlayAction({ tab });

          const { executionPlatform } = track.getCall(0).args[1];

          // then
          expect(executionPlatform).to.eql('Camunda Cloud');
        });

      });

      describe('default engine profile', function() {

        it('bpmn', async function() {

          // given
          const tab = createTab({
            type: 'bpmn',
            file: {
              contents: emptyXML
            }
          });

          const handleOverlayAction = subscribe.getCall(0).args[1];

          // when
          await handleOverlayAction({ tab });

          const { executionPlatform } = track.getCall(0).args[1];

          // then
          expect(executionPlatform).to.eql('Camunda Platform');
        });


        it('dmn', async function() {

          // given
          const tab = createTab({
            type: 'dmn',
            file: {
              contents: emptyDMN
            }
          });

          const handleOverlayAction = subscribe.getCall(0).args[1];

          // when
          await handleOverlayAction({ tab });

          const { executionPlatform } = track.getCall(0).args[1];

          // then
          expect(executionPlatform).to.eql('Camunda Platform');
        });

      });

    });

  });


  describe('version info overlay', function() {

    it('should send source', async function() {

      // given
      const tab = createTab({
        type: 'bpmn'
      });

      const handleOverlayAction = subscribe.getCall(2).args[1];

      // when
      await handleOverlayAction({
        tab,
        source: 'foo'
      });

      // then
      expect(track).to.have.been.calledWith('overlay:versionInfo:opened', {
        source: 'foo'
      });

    });

  });

});


// helpers ///////////////

function createTab(overrides = {}) {
  return {
    id: 42,
    name: 'foo.bar',
    type: 'bar',
    title: 'foo',
    file: {
      name: 'foo.bar',
      contents: '',
      path: null
    },
    ...overrides
  };
}