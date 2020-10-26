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
