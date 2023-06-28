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

import DeploymentEventHandler from '../DeploymentEventHandler';

import engineProfileXML from './fixtures/engine-profile.bpmn';
import engineProfileDMN from './fixtures/engine-platform.dmn';

import engineProfileCloudXML from './fixtures/engine-cloud.bpmn';
import engineProfileCloudDMN from './fixtures/engine-cloud.dmn';

import emptyDMN from './fixtures/empty.dmn';

import emptyXML from './fixtures/empty.bpmn';
import MixpanelHandler from '../../MixpanelHandler';

const EXAMPLE_ERROR = 'something went wrong';


describe('<DeploymentEventHandler>', () => {

  let subscribe, track;

  beforeEach(() => {

    subscribe = sinon.spy();

    track = sinon.spy();

    new DeploymentEventHandler({ track, subscribe });

    MixpanelHandler.getInstance().enable('token', 'id', 'stage');
  });


  describe('should subcribe', () => {

    it('should subscribe to deployment.done', () => {
      expect(subscribe.getCall(0).args[0]).to.eql('deployment.done');
    });


    it('should subscribe to deployment.error', () => {
      expect(subscribe.getCall(1).args[0]).to.eql('deployment.error');
    });

  });


  describe('deployment.done', () => {

    describe('deployment tool', () => {

      describe('should send for type', () => {

        it('bpmn', async () => {

          // given
          const tab = createTab({
            type: 'bpmn'
          });

          const handleDeploymentDone = subscribe.getCall(0).args[1];

          // when
          await handleDeploymentDone({
            tab,
            context: 'deploymentTool',
            deployedTo: {
              executionPlatformVersion: '7.15.0',
              executionPlatform: 'Camunda'
            }
          });

          // then
          expect(track).to.have.been.calledWith('deploy:success', {
            diagramType: 'bpmn',
            deployedTo: {
              executionPlatformVersion: '7.15.0',
              executionPlatform: 'Camunda'
            }
          });
        });


        it('cloud-bpmn', async () => {

          // given
          const tab = createTab({
            type: 'cloud-bpmn'
          });

          const handleDeploymentDone = subscribe.getCall(0).args[1];

          // when
          await handleDeploymentDone({
            tab,
            context: 'deploymentTool'
          });

          // then
          expect(track).to.have.been.calledWith('deploy:success', {
            diagramType: 'bpmn'
          });
        });


        it('dmn', async () => {

          // given
          const tab = createTab({
            type: 'dmn'
          });

          const handleDeploymentDone = subscribe.getCall(0).args[1];

          // when
          await handleDeploymentDone({
            tab,
            context: 'deploymentTool',
            deployedTo: {
              executionPlatformVersion: '7.15.0',
              executionPlatform: 'Camunda'
            }
          });

          // then
          expect(track).to.have.been.calledWith('deploy:success', {
            diagramType: 'dmn',
            deployedTo: {
              executionPlatformVersion: '7.15.0',
              executionPlatform: 'Camunda'
            }
          });
        });


        it('cloud dmn', async () => {

          // given
          const tab = createTab({
            type: 'cloud-dmn'
          });

          const handleDeploymentDone = subscribe.getCall(0).args[1];

          // when
          await handleDeploymentDone({
            tab,
            context: 'deploymentTool',
            deployedTo: {
              executionPlatformVersion: '8.0.0',
              executionPlatform: 'Camunda'
            }
          });

          // then
          expect(track).to.have.been.calledWith('deploy:success', {
            diagramType: 'dmn',
            deployedTo: {
              executionPlatformVersion: '8.0.0',
              executionPlatform: 'Camunda'
            }
          });
        });

      });


      it('should NOT send for type cmmn', async () => {

        // given
        const tab = createTab({
          type: 'cmmn'
        });

        const handleDeploymentDone = subscribe.getCall(0).args[1];

        // when
        await handleDeploymentDone({ tab });

        // then
        expect(track).to.not.have.been.called;
      });

    });


    describe('start instance tool', () => {

      describe('should send for type', () => {


        it('bpmn', async () => {

          // given
          const tab = createTab({
            type: 'bpmn'
          });

          const handleDeploymentDone = subscribe.getCall(0).args[1];

          // when
          await handleDeploymentDone({
            tab,
            context: 'startInstanceTool',
            deployedTo: {
              executionPlatformVersion: '7.15.0',
              executionPlatform: 'Camunda'
            }
          });

          // then
          expect(track).to.have.been.calledWith('startInstance:success', {
            diagramType: 'bpmn',
            deployedTo: {
              executionPlatformVersion: '7.15.0',
              executionPlatform: 'Camunda'
            }
          });
        });


        it('cloud-bpmn', async () => {

          // given
          const tab = createTab({
            type: 'cloud-bpmn'
          });

          const handleDeploymentDone = subscribe.getCall(0).args[1];

          // when
          await handleDeploymentDone({
            tab,
            context: 'startInstanceTool'
          });

          // then
          expect(track).to.have.been.calledWith('startInstance:success', {
            diagramType: 'bpmn'
          });
        });


        it('dmn', async () => {

          // given
          const tab = createTab({
            type: 'dmn'
          });

          const handleDeploymentDone = subscribe.getCall(0).args[1];

          // when
          await handleDeploymentDone({
            tab,
            context: 'startInstanceTool',
            deployedTo: {
              executionPlatformVersion: '7.15.0',
              executionPlatform: 'Camunda'
            }
          });

          // then
          expect(track).to.have.been.calledWith('startInstance:success', {
            diagramType: 'dmn',
            deployedTo: {
              executionPlatformVersion: '7.15.0',
              executionPlatform: 'Camunda'
            }
          });
        });


        it('cloud dmn', async () => {

          // given
          const tab = createTab({
            type: 'cloud-dmn'
          });

          const handleDeploymentDone = subscribe.getCall(0).args[1];

          // when
          await handleDeploymentDone({
            tab,
            context: 'startInstanceTool',
            deployedTo: {
              executionPlatformVersion: '8.0.0',
              executionPlatform: 'Camunda'
            }
          });

          // then
          expect(track).to.have.been.calledWith('startInstance:success', {
            diagramType: 'dmn',
            deployedTo: {
              executionPlatformVersion: '8.0.0',
              executionPlatform: 'Camunda'
            }
          });
        });

      });


      it('should NOT send for type cmmn', async () => {

        // given
        const tab = createTab({
          type: 'cmmn'
        });

        const handleDeploymentDone = subscribe.getCall(0).args[1];

        // when
        await handleDeploymentDone({ tab });

        // then
        expect(track).to.not.have.been.called;
      });

    });

  });


  describe('deployment.error', () => {


    it('deployment tool', async () => {

      // given
      const tab = createTab({
        type: 'bpmn'
      });

      const error = {
        code: EXAMPLE_ERROR
      };

      const handleDeploymentError = subscribe.getCall(1).args[1];

      // when
      await handleDeploymentError({
        tab,
        error,
        context: 'deploymentTool',
        deployedTo: {
          executionPlatformVersion: '7.15.0',
          executionPlatform: 'camunda'
        }
      });

      const deployment = track.getCall(0).args[1];

      // then
      expect(track).to.have.been.calledOnce;
      expect(deployment).to.eql({
        diagramType: 'bpmn',
        error: EXAMPLE_ERROR,
        deployedTo: {
          executionPlatformVersion: '7.15.0',
          executionPlatform: 'camunda'
        }
      });
    });


    it('start instance tool', async () => {

      // given
      const tab = createTab({
        type: 'bpmn'
      });

      const error = {
        code: EXAMPLE_ERROR
      };

      const handleDeploymentError = subscribe.getCall(1).args[1];

      // when
      await handleDeploymentError({
        tab,
        error,
        context: 'startInstanceTool',
        deployedTo: {
          executionPlatformVersion: '7.15.0',
          executionPlatform: 'camunda'
        }
      });

      const deployment = track.getCall(0).args[1];

      // then
      expect(track).to.have.been.calledOnce;
      expect(deployment).to.eql({
        diagramType: 'bpmn',
        error: EXAMPLE_ERROR,
        deployedTo: {
          executionPlatformVersion: '7.15.0',
          executionPlatform: 'camunda'
        }
      });
    });

  });


  describe('should send engine profile', () => {

    describe('set engine profile', () => {

      it('bpmn', async () => {

        // given
        const tab = createTab({
          type: 'bpmn',
          file: {
            contents: engineProfileXML
          }
        });

        const handleDeploymentDone = subscribe.getCall(0).args[1];

        // when
        await handleDeploymentDone({ tab });

        const { executionPlatform, executionPlatformVersion } = track.getCall(0).args[1];

        // then
        expect(executionPlatform).to.eql('Camunda Platform');
        expect(executionPlatformVersion).to.eql('7.15.0');

      });


      it('cloud bpmn', async () => {

        // given
        const tab = createTab({
          type: 'cloud-bpmn',
          file: {
            contents: engineProfileCloudXML
          }
        });

        const handleDeploymentDone = subscribe.getCall(0).args[1];

        // when
        await handleDeploymentDone({ tab });

        const { executionPlatform } = track.getCall(0).args[1];

        // then
        expect(executionPlatform).to.eql('Camunda Cloud');

      });


      it('dmn', async () => {

        // given
        const tab = createTab({
          type: 'dmn',
          file: {
            contents: engineProfileDMN
          }
        });

        const handleDeploymentDone = subscribe.getCall(0).args[1];

        // when
        await handleDeploymentDone({ tab });

        const { executionPlatform, executionPlatformVersion } = track.getCall(0).args[1];

        // then
        expect(executionPlatform).to.eql('Camunda Platform');
        expect(executionPlatformVersion).to.eql('7.16.0');

      });


      it('cloud dmn', async () => {

        // given
        const tab = createTab({
          type: 'cloud-dmn',
          file: {
            contents: engineProfileCloudDMN
          }
        });

        const handleDeploymentDone = subscribe.getCall(0).args[1];

        // when
        await handleDeploymentDone({ tab });

        const { executionPlatform } = track.getCall(0).args[1];

        // then
        expect(executionPlatform).to.eql('Camunda Cloud');
      });

    });


    describe('default engine profile', () => {

      it('bpmn', async () => {

        // given
        const tab = createTab({
          type: 'bpmn',
          file: {
            contents: emptyXML
          }
        });

        const handleDeploymentDone = subscribe.getCall(0).args[1];

        // when
        await handleDeploymentDone({ tab });

        const { executionPlatform } = track.getCall(0).args[1];

        // then
        expect(executionPlatform).to.eql('Camunda Platform');
      });


      it('dmn', async () => {

        // given
        const tab = createTab({
          type: 'dmn',
          file: {
            contents: emptyDMN
          }
        });

        const handleDeploymentDone = subscribe.getCall(0).args[1];

        // when
        await handleDeploymentDone({ tab });

        const { executionPlatform } = track.getCall(0).args[1];

        // then
        expect(executionPlatform).to.eql('Camunda Platform');
      });


    });

  });


  it('should send target type', async () => {

    // given
    const tab = createTab({
      type: 'cloud-bpmn'
    });

    const cloudTargetType = 'camundaCloud';

    const handleDeploymentDone = subscribe.getCall(0).args[1];

    // when
    await handleDeploymentDone({ tab, targetType: cloudTargetType });

    const { targetType } = track.getCall(0).args[1];

    // then
    expect(targetType).to.eql(cloudTargetType);
  });


  it('should send template ids in diagram', async () => {

    // given
    const tab = createTab({
      type: 'bpmn'
    });

    const handleBpmnCreated = subscribe.getCall(2).args[1];

    await handleBpmnCreated({ modeler: {
      get: () => {
        return {
          getAll: () => [
            { id: 'foo', modelerTemplate: 'templateId_foo' },
            { id: 'bar', modelerTemplate: 'templateId_bar' }
          ]
        };}
    } });

    // when
    const handleDeploymentDone = subscribe.getCall(0).args[1];

    await handleDeploymentDone({ tab });

    // then
    const { templateIds } = track.getCall(0).args[1];
    expect(templateIds).to.have.length(2);
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
