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

    // when
    const diagramOpenEventHandler = new DiagramOpenEventHandler({ onSend, subscribe, config });

    diagramOpenEventHandler.enable();

    const bpmnCallback = subscribe.getCall(0).args[1];

    await bpmnCallback({ tab: { file: {} } });

    // then
    expect(onSend).to.have.been.calledWith({
      event: 'diagramOpened',
      diagramType: 'bpmn',
      elementTemplateCount: 0,
      diagramMetrics: {},
      elementTemplates: []
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

      // when
      const diagramOpenEventHandler = new DiagramOpenEventHandler({ onSend, subscribe, config });

      diagramOpenEventHandler.enable();

      const bpmnCallback = subscribe.getCall(0).args[1];

      await bpmnCallback({ tab: { file: { path: 'testPath' } } });

      const configArgs = configSpy.getCall(0).args;

      // then
      expect(configArgs).to.eql([ 'bpmn.elementTemplates', { path: 'testPath' } ]);
      expect(onSend).to.have.been.calledWith({
        event: 'diagramOpened',
        diagramType: 'bpmn',
        diagramMetrics: {},
        elementTemplateCount: 1,
        elementTemplates: [
          {
            appliesTo: [ 'bpmn:ServiceTask' ],
            properties: {
              'camunda:asyncBefore': 1,
              'camunda:class': 1,
              'camunda:inputParameter': 3,
              'camunda:outputParameter': 1
            }
          }
        ]
      });
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

      // when
      const diagramOpenEventHandler = new DiagramOpenEventHandler({ onSend, subscribe, config });

      diagramOpenEventHandler.enable();

      const bpmnCallback = subscribe.getCall(0).args[1];

      await bpmnCallback({ tab: { file: { path: 'testPath' } } });

      // then
      expect(onSendSpy).to.have.been.calledWith({
        event: 'diagramOpened',
        diagramMetrics: {},
        diagramType: 'bpmn',
        elementTemplateCount: 1,
      });
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

        const metrics = onSend.getCall(0).args[0].diagramMetrics;

        // then
        expect(metrics.processVariablesCount).to.eql(3);
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

        const metrics = onSend.getCall(0).args[0].diagramMetrics;

        // then
        expect(metrics.processVariablesCount).to.eql(0);
      });

    });


    describe('user tasks', () => {

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

        const metrics = onSend.getCall(0).args[0].diagramMetrics;

        // then
        expect(metrics.tasks.userTask).to.eql({
          count: 8,
          form: {
            count: 6,
            embedded: 3,
            external: 1,
            generic: 1,
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

        const metrics = onSend.getCall(0).args[0].diagramMetrics;

        // then
        expect(metrics.tasks.userTask).to.eql({
          count: 8,
          form: {
            count: 6,
            embedded: 3,
            external: 1,
            generic: 1,
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

        const metrics = onSend.getCall(0).args[0].diagramMetrics;

        // then
        expect(metrics.tasks.userTask).to.eql({
          count: 4,
          form: {
            count: 4,
            embedded: 1,
            external: 2,
            generic: 0,
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

        const metrics = onSend.getCall(0).args[0].diagramMetrics;

        // then
        expect(metrics.tasks.userTask).to.eql({
          count: 0,
          form: {
            count: 0,
            embedded: 0,
            external: 0,
            generic: 0,
            other: 0
          }
        });
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
