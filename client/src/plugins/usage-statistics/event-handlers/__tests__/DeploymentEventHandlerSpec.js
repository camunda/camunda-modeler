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

import diagramXML from './fixtures/process-variables.bpmn';

const EXAMPLE_ERROR = 'something went wrong';

const SUCCESS_STATUS = 'success';


describe('<DeploymentEventHandler>', () => {

  let subscribe, onSend, deploymentEventHandler;

  beforeEach(() => {

    subscribe = sinon.spy();

    onSend = sinon.spy();

    deploymentEventHandler = new DeploymentEventHandler({ onSend, subscribe });

    deploymentEventHandler.enable();
  });

  it('should subscribe to deployment.done', () => {
    expect(subscribe.getCall(0).args[0]).to.eql('deployment.done');
  });


  it('should subscribe to deployment.error', () => {
    expect(subscribe.getCall(1).args[0]).to.eql('deployment.error');
  });


  it('should NOT send anything if disabled', async () => {

    // given
    const tab = createTab({
      type: 'bpmn'
    });

    const handleDeploymentDone = subscribe.getCall(0).args[1];

    // when
    deploymentEventHandler.disable();

    handleDeploymentDone({ tab });

    // then
    expect(onSend).to.not.have.been.called;
  });


  it('should send for type bpmn', async () => {

    // given
    const tab = createTab({
      type: 'bpmn'
    });

    const handleDeploymentDone = subscribe.getCall(0).args[1];

    // when
    await handleDeploymentDone({
      tab,
      context: 'foo'
    });

    // then
    expect(onSend).to.have.been.calledWith({
      event: 'deployment',
      diagramType: 'bpmn',
      diagramMetrics: {},
      deployment: {
        outcome: SUCCESS_STATUS,
        context: 'foo'
      }
    });
  });


  it('should send for type dmn', async () => {

    // given
    const tab = createTab({
      type: 'dmn'
    });

    const handleDeploymentDone = subscribe.getCall(0).args[1];

    // when
    await handleDeploymentDone({
      tab,
      context: 'foo'
    });

    // then
    expect(onSend).to.have.been.calledWith({
      event: 'deployment',
      diagramType: 'dmn',
      diagramMetrics: {},
      deployment: {
        outcome: SUCCESS_STATUS,
        context: 'foo'
      }
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
    expect(onSend).to.not.have.been.called;
  });


  it('should send deployment error', async () => {

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
      context: 'foo'
    });

    // then
    expect(onSend).to.have.been.calledWith({
      event: 'deployment',
      diagramType: 'bpmn',
      diagramMetrics: {},
      deployment: {
        outcome: 'failure',
        error: EXAMPLE_ERROR,
        context: 'foo'
      }
    });
  });


  describe('diagram metrics', () => {

    it('should send process variables count', async () => {

      // given
      const tab = createTab({
        type: 'bpmn',
        file: {
          contents: diagramXML
        }
      });

      const handleDeploymentDone = subscribe.getCall(0).args[1];

      // when
      await handleDeploymentDone({ tab });

      // then
      const metrics = onSend.getCall(0).args[0].diagramMetrics;

      expect(metrics.processVariablesCount).to.equal(3);
    });


    it('should NOT send process variables count when no contents', async () => {

      // given
      const tab = createTab({
        type: 'bpmn'
      });

      const handleDeploymentDone = subscribe.getCall(0).args[1];

      // when
      await handleDeploymentDone({ tab });

      // then
      const metrics = onSend.getCall(0).args[0].diagramMetrics;

      expect(metrics.processVariablesCount).not.to.exist;
    });


    it('should NOT send process variables count for dmn files', async () => {

      // given
      const tab = createTab({
        type: 'dmn'
      });

      const handleDeploymentDone = subscribe.getCall(0).args[1];

      // when
      await handleDeploymentDone({ tab });

      // then
      const metrics = onSend.getCall(0).args[0].diagramMetrics;

      expect(metrics.processVariablesCount).not.to.exist;
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