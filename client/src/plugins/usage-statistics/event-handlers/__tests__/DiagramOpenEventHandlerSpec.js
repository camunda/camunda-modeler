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


  it('should send with diagram-type: bpmn', () => {

    // given
    const subscribe = sinon.spy();
    const onSend = sinon.spy();

    // when
    const diagramOpenEventHandler = new DiagramOpenEventHandler({ onSend, subscribe });

    diagramOpenEventHandler.enable();

    const bpmnCallback = subscribe.getCall(0).args[1];

    bpmnCallback();

    // then
    expect(onSend).to.have.been.calledWith({
      event: 'diagramOpened',
      'diagram-type': 'bpmn'
    });
  });


  it('should send with diagram-type: dmn', () => {

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
      'diagram-type': 'dmn'
    });
  });
});
