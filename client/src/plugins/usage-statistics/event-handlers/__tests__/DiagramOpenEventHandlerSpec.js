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

import DiagramOpenEventHandler from '../DiagramOpenEventHandler';

import processVariablesXML from './fixtures/process-variables.bpmn';

import userTasksXML from './fixtures/user-tasks.bpmn';

import userTasksWithParticipantsXML from './fixtures/user-tasks-with-participants.bpmn';

import userTasksWithSubprocessXML from './fixtures/user-tasks-with-subprocess.bpmn';

import zeebeUserTasksXML from './fixtures/user-tasks.zeebe.bpmn';

import zeebeUserTasksWithSubprocessXML from './fixtures/user-tasks-with-subprocess.zeebe.bpmn';

import zeebeUserTasksWithParticipantsXML from './fixtures/user-tasks-with-participants.zeebe.bpmn';

import engineProfileXML from './fixtures/engine-profile.bpmn';

import emptyXML from './fixtures/empty.bpmn';


describe('<DiagramOpenEventHandler>', () => {

  it('should subscribe to bpmn.modeler.created', () => {

    // given
    const subscribe = sinon.spy();

    // when
    new DiagramOpenEventHandler({ subscribe });

    // then
    expect(subscribe.getCall(0).args[0]).to.eql('bpmn.modeler.created');
  });


  it('should subscribe to dmn.modeler.created', () => {

    // given
    const subscribe = sinon.spy();

    // when
    new DiagramOpenEventHandler({ subscribe });

    // then
    expect(subscribe.getCall(1).args[0]).to.eql('dmn.modeler.created');
  });


  it('should subscribe to cmmn.modeler.created', () => {

    // given
    const subscribe = sinon.spy();

    // when
    new DiagramOpenEventHandler({ subscribe });

    // then
    expect(subscribe.getCall(2).args[0]).to.eql('cmmn.modeler.created');
  });


  it('should send with diagram type: bpmn', async () => {

    // given
    const subscribe = sinon.spy();

    const onSend = sinon.spy();

    const config = { get: () => null };

    const tab = createTab({
      file: {},
      type: 'bpmn'
    });

    // when
    const diagramOpenEventHandler = new DiagramOpenEventHandler({ onSend, subscribe, config });

    diagramOpenEventHandler.enable();

    const bpmnCallback = subscribe.getCall(0).args[1];

    await bpmnCallback({ tab });

    // then
    expect(onSend).to.have.been.calledWith({
      event: 'diagramOpened',
      diagramType: 'bpmn',
      engineProfile: {},
      diagramMetrics: {},
      elementTemplates: [],
      elementTemplateCount: 0,
    });
  });


  it('should send with diagram type: dmn', () => {

    // given
    const subscribe = sinon.spy();

    const onSend = sinon.spy();

    // when
    const diagramOpenEventHandler = new DiagramOpenEventHandler({ onSend, subscribe });

    diagramOpenEventHandler.enable();

    const dmnCallback = subscribe.getCall(1).args[1];

    dmnCallback();

    // then
    expect(onSend).to.have.been.calledWith({
      event: 'diagramOpened',
      diagramType: 'dmn'
    });
  });


  it('should send with diagram type: cmmn', () => {

    // given
    const subscribe = sinon.spy();

    const onSend = sinon.spy();

    // when
    const diagramOpenEventHandler = new DiagramOpenEventHandler({ onSend, subscribe });

    diagramOpenEventHandler.enable();

    const cmmnCallback = subscribe.getCall(2).args[1];

    cmmnCallback();

    // then
    expect(onSend).to.have.been.calledWith({
      event: 'diagramOpened',
      diagramType: 'cmmn'
    });
  });


  describe('element templates', () => {

    it('should send element templates', async () => {

      // given
      const subscribe = sinon.spy();

      const onSend = sinon.spy();

      const configSpy = sinon.spy();

      const config = { get: (key, file) => {
        configSpy(key, file);

        return mockElementTemplates();
      } };

      const tab = createTab({
        file: { path: 'testPath' },
        type: 'bpmn'
      });

      // when
      const diagramOpenEventHandler = new DiagramOpenEventHandler({ onSend, subscribe, config });

      diagramOpenEventHandler.enable();

      const bpmnCallback = subscribe.getCall(0).args[1];

      await bpmnCallback({ tab });

      const configArgs = configSpy.getCall(0).args;

      const elementTemplates = onSend.getCall(0).args[0].elementTemplates;

      // then
      expect(configArgs).to.eql([ 'bpmn.elementTemplates', { path: 'testPath' } ]);
      expect(elementTemplates).to.eql([
        {
          appliesTo: [ 'bpmn:ServiceTask' ],
          properties: {
            'camunda:asyncBefore': 1,
            'camunda:class': 1,
            'camunda:inputParameter': 3,
            'camunda:outputParameter': 1
          }
        }
      ]);
    });


    it('should resend minimal data if payload is too big', async () => {

      // given
      const subscribe = sinon.spy();

      const config = { get: () => mockElementTemplates() };

      const onSendSpy = sinon.spy();

      const onSend = (data) => new Promise((resolve, reject) => {

        onSendSpy(data);

        // http status: payload too big
        resolve({ status: 413 });
      });

      const tab = createTab({
        file: { path: 'testPath' },
        type: 'bpmn'
      });

      // when
      const diagramOpenEventHandler = new DiagramOpenEventHandler({ onSend, subscribe, config });

      diagramOpenEventHandler.enable();

      const bpmnCallback = subscribe.getCall(0).args[1];

      await bpmnCallback({ tab });

      const {
        elementTemplates,
        elementTemplateCount
      } = onSendSpy.getCall(1).args[0];

      // then
      expect(elementTemplates).to.not.exist;
      expect(elementTemplateCount).to.equal(1);
    });

  });


  describe('diagram metrics', () => {

    describe('process variables', () => {

      it('should send process variables', async () => {

        // given
        const subscribe = sinon.spy();

        const onSend = sinon.spy();

        const tab = createTab({
          type: 'bpmn',
          file: {
            contents: processVariablesXML
          }
        });

        const config = { get: () => null };

        // when
        const diagramOpenEventHandler = new DiagramOpenEventHandler({ onSend, subscribe, config });

        diagramOpenEventHandler.enable();

        const bpmnCallback = subscribe.getCall(0).args[1];

        await bpmnCallback({ tab });

        const { diagramMetrics } = onSend.getCall(0).args[0];

        // then
        expect(diagramMetrics.processVariablesCount).to.eql(3);
      });


      it('should send empty process variables count', async () => {

        // given
        const subscribe = sinon.spy();

        const onSend = sinon.spy();

        const tab = createTab({
          type: 'bpmn',
          file: {
            contents: emptyXML
          }
        });

        const config = { get: () => null };

        // when
        const diagramOpenEventHandler = new DiagramOpenEventHandler({ onSend, subscribe, config });

        diagramOpenEventHandler.enable();

        const bpmnCallback = subscribe.getCall(0).args[1];

        await bpmnCallback({ tab });

        const { diagramMetrics } = onSend.getCall(0).args[0];

        // then
        expect(diagramMetrics.processVariablesCount).to.eql(0);
      });

    });


    describe('user tasks - bpmn', () => {

      it('should send metrics with root level user tasks', async () => {

        // given
        const subscribe = sinon.spy();
        const onSend = sinon.spy();
        const tab = createTab({
          type: 'bpmn',
          file: {
            contents: userTasksXML
          }
        });

        const config = { get: () => null };

        // when
        const diagramOpenEventHandler = new DiagramOpenEventHandler({ onSend, subscribe, config });

        diagramOpenEventHandler.enable();

        const bpmnCallback = subscribe.getCall(0).args[1];

        await bpmnCallback({ tab });

        const { diagramMetrics } = onSend.getCall(0).args[0];

        // then
        expect(diagramMetrics.tasks.userTask).to.eql({
          count: 8,
          form: {
            count: 6,
            embedded: 3,
            external: 1,
            generated: 1,
            other: 1
          }
        });
      });


      it('should send metrics with user tasks in pools', async () => {

        // given
        const subscribe = sinon.spy();
        const onSend = sinon.spy();
        const tab = createTab({
          type: 'bpmn',
          file: {
            contents: userTasksWithParticipantsXML
          }
        });

        const config = { get: () => null };

        // when
        const diagramOpenEventHandler = new DiagramOpenEventHandler({ onSend, subscribe, config });

        diagramOpenEventHandler.enable();

        const bpmnCallback = subscribe.getCall(0).args[1];

        await bpmnCallback({ tab });

        const { diagramMetrics } = onSend.getCall(0).args[0];

        // then
        expect(diagramMetrics.tasks.userTask).to.eql({
          count: 8,
          form: {
            count: 6,
            embedded: 3,
            external: 1,
            generated: 1,
            other: 1
          }
        });
      });


      it('should send metrics with user tasks in subprocess', async () => {

        // given
        const subscribe = sinon.spy();
        const onSend = sinon.spy();
        const tab = createTab({
          type: 'bpmn',
          file: {
            contents: userTasksWithSubprocessXML
          }
        });

        const config = { get: () => null };

        // when
        const diagramOpenEventHandler = new DiagramOpenEventHandler({ onSend, subscribe, config });

        diagramOpenEventHandler.enable();

        const bpmnCallback = subscribe.getCall(0).args[1];

        await bpmnCallback({ tab });

        const { diagramMetrics } = onSend.getCall(0).args[0];

        // then
        expect(diagramMetrics.tasks.userTask).to.eql({
          count: 4,
          form: {
            count: 4,
            embedded: 1,
            external: 2,
            generated: 0,
            other: 1
          }
        });
      });


      it('should send empty metrics without any tasks', async () => {

        // given
        const subscribe = sinon.spy();
        const onSend = sinon.spy();
        const tab = createTab({
          type: 'bpmn',
          file: {
            contents: emptyXML
          }
        });

        const config = { get: () => null };

        // when
        const diagramOpenEventHandler = new DiagramOpenEventHandler({ onSend, subscribe, config });

        diagramOpenEventHandler.enable();

        const bpmnCallback = subscribe.getCall(0).args[1];

        await bpmnCallback({ tab });

        const { diagramMetrics } = onSend.getCall(0).args[0];

        // then
        expect(diagramMetrics.tasks.userTask).to.eql({
          count: 0,
          form: {
            count: 0,
            embedded: 0,
            external: 0,
            generated: 0,
            other: 0
          }
        });

      });

    });


    describe('user tasks - cloud', () => {

      it('should send metrics with user tasks', async () => {

        // given
        const subscribe = sinon.spy();
        const onSend = sinon.spy();
        const tab = createTab({
          type: 'cloud-bpmn',
          file: {
            contents: zeebeUserTasksXML
          }
        });

        const config = { get: () => null };

        // when
        const diagramOpenEventHandler = new DiagramOpenEventHandler({ onSend, subscribe, config });

        diagramOpenEventHandler.enable();

        const bpmnCallback = subscribe.getCall(0).args[1];

        await bpmnCallback({ tab });

        const { diagramMetrics } = onSend.getCall(0).args[0];

        // then
        expect(diagramMetrics.tasks.userTask).to.eql({
          count: 3,
          form: {
            count: 3,
            camundaForms: 3,
            other: 0
          }
        });

      });


      it('should send metrics with user tasks - sub processes', async () => {

        // given
        const subscribe = sinon.spy();
        const onSend = sinon.spy();
        const tab = createTab({
          type: 'cloud-bpmn',
          file: {
            contents: zeebeUserTasksWithSubprocessXML
          }
        });

        const config = { get: () => null };

        // when
        const diagramOpenEventHandler = new DiagramOpenEventHandler({ onSend, subscribe, config });

        diagramOpenEventHandler.enable();

        const bpmnCallback = subscribe.getCall(0).args[1];

        await bpmnCallback({ tab });

        const { diagramMetrics } = onSend.getCall(0).args[0];

        // then
        expect(diagramMetrics.tasks.userTask).to.eql({
          count: 4,
          form: {
            count: 4,
            camundaForms: 4,
            other: 0
          }
        });

      });


      it('should send metrics with user tasks - participants', async () => {

        // given
        const subscribe = sinon.spy();
        const onSend = sinon.spy();
        const tab = createTab({
          type: 'cloud-bpmn',
          file: {
            contents: zeebeUserTasksWithParticipantsXML
          }
        });

        const config = { get: () => null };

        // when
        const diagramOpenEventHandler = new DiagramOpenEventHandler({ onSend, subscribe, config });

        diagramOpenEventHandler.enable();

        const bpmnCallback = subscribe.getCall(0).args[1];

        await bpmnCallback({ tab });

        const { diagramMetrics } = onSend.getCall(0).args[0];

        // then
        expect(diagramMetrics.tasks.userTask).to.eql({
          count: 4,
          form: {
            count: 4,
            camundaForms: 4,
            other: 0
          }
        });

      });

    });

  });


  describe('engine profile', () => {

    it('should send engine profile', async () => {

      // given
      const subscribe = sinon.spy();

      const onSend = sinon.spy();

      const tab = createTab({
        type: 'bpmn',
        file: {
          contents: engineProfileXML
        }
      });

      const config = { get: () => null };

      // when
      const diagramOpenEventHandler = new DiagramOpenEventHandler({ onSend, subscribe, config });

      diagramOpenEventHandler.enable();

      const bpmnCallback = subscribe.getCall(0).args[1];

      await bpmnCallback({ tab });

      const { engineProfile } = onSend.getCall(0).args[0];

      // then
      expect(engineProfile).to.eql({
        executionPlatform: 'Camunda Platform',
        executionPlatformVersion: '7.15.0'
      });
    });

  });

});


// helpers //////

function mockElementTemplates() {
  return [
    {
      appliesTo: [ 'bpmn:ServiceTask'],
      properties: [
        { binding: { name: 'camunda:class', type: 'property' } },
        { binding: { name: 'sender', type: 'camunda:inputParameter' } },
        { binding: { name: 'receivers', type: 'camunda:inputParameter' } },
        { binding: { name: 'messageBody', type: 'camunda:inputParameter' } },
        { binding: { type: 'camunda:outputParameter' } },
        { binding: { name: 'camunda:asyncBefore', type: 'property' } }
      ]
    }
  ];
}

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
