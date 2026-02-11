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

import React, { createRef } from 'react';

import { render } from '@testing-library/react';

import ElementTemplatesModal from '../ElementTemplatesModal';


describe('<ElementTemplatesModal>', function() {

  describe('basics', function() {

    it('should render', async function() {

      // when
      const {
        instance,
        container
      } = await createElementTemplatesModal();

      // then
      expect(instance).to.exist;
      expect(container).to.exist;
    });


    it('should subscribe to app.activeTabChanged', async function() {

      // given
      const {
        callSubscriber,
        subscribe
      } = createSubscribe('app.activeTabChanged');

      const activeTab = createTab();

      const { instance } = await createElementTemplatesModal({ subscribe });

      const handleActiveTabChangedSpy = sinon.spy(instance, 'handleActiveTabChanged');

      // when
      callSubscriber({ activeTab });

      // then
      expect(handleActiveTabChangedSpy).to.have.been.calledWithMatch({ activeTab });
    });


    it('should subscribe to bpmn.modeler.configure', async function() {

      // given
      const {
        callSubscriber,
        subscribe
      } = createSubscribe('bpmn.modeler.configure');

      const { instance } = await createElementTemplatesModal({ subscribe });

      const handleBpmnModelerConfigureSpy = sinon.spy(instance, 'handleBpmnModelerConfigure');

      // when
      callSubscriber({ middlewares: [] });

      // then
      expect(handleBpmnModelerConfigureSpy).to.have.been.called;
    });


    it('should configure on <bpmn> tab', async function() {

      // given
      const {
        callSubscriber,
        subscribe
      } = createSubscribe('bpmn.modeler.configure');

      const middlewares = [];
      const tab = { type: 'bpmn' };

      await createElementTemplatesModal({ subscribe });

      // when
      callSubscriber({ middlewares, tab });

      // then
      expect(middlewares).not.to.be.empty;
    });


    it('should configure on <cloud-bpmn> tab', async function() {

      // given
      const {
        callSubscriber,
        subscribe
      } = createSubscribe('bpmn.modeler.configure');

      const middlewares = [];
      const tab = { type: 'cloud-bpmn' };

      await createElementTemplatesModal({ subscribe });

      // when
      callSubscriber({ middlewares, tab });

      // then
      expect(middlewares).not.to.be.empty;
    });


    it('should NOT configure on <foo> tab', async function() {

      // given
      const {
        callSubscriber,
        subscribe
      } = createSubscribe('bpmn.modeler.configure');

      const middlewares = [];
      const tab = { type: 'foo' };

      await createElementTemplatesModal({ subscribe });

      // when
      callSubscriber({ middlewares, tab });

      // then
      expect(middlewares).to.be.empty;
    });

  });


  describe('apply element template', function() {

    const elementTemplate = { id: 'foo' };

    let instance,
        triggerActionSpy;

    beforeEach(async function() {
      triggerActionSpy = sinon.spy();

      ({ instance } = await createElementTemplatesModal({ triggerAction: triggerActionSpy }));
    });


    it('should apply element template', function() {

      // given
      instance.setState({
        activeTab: createTab('bpmn')
      });

      // when
      instance.onApply(elementTemplate);

      // then
      expect(triggerActionSpy).to.have.been.calledWith('applyElementTemplate', elementTemplate);
    });


    it('should not apply element template', function() {

      // given
      instance.setState({
        activeTab: createTab('dmn')
      });

      // when
      instance.onApply(elementTemplate);

      // then
      expect(triggerActionSpy).not.to.have.been.called;
    });

  });


  describe('modal', function() {


    let instance;

    beforeEach(async function() {
      ({ instance } = await createElementTemplatesModal());
    });


    it('should open modal', function() {

      // when
      instance.onOpen();

      // then
      expect(instance.state.showModal).to.be.true;
    });


    it('should close modal', function() {

      // given
      instance.setState({ showModal: true });

      // assume
      expect(instance.state.showModal).to.be.true;

      // when
      instance.onClose();

      // then
      expect(instance.state.showModal).to.be.false;
    });

  });

});

async function createElementTemplatesModal(props = {}) {
  const defaultProps = {
    config: {},
    displayNotification() {},
    subscribe() {
      return { cancel() {} };
    },
    triggerAction() {}
  };

  const ref = createRef();

  const { container } = render(<ElementTemplatesModal ref={ ref } { ...{ ...defaultProps, ...props } } />);

  const instance = ref.current;

  instance.setState({
    activeTab: createTab()
  });

  return {
    instance,
    container
  };
}

function createSubscribe(event) {
  let callback = null;

  function subscribe(_event, _callback) {
    if (event === _event) {
      callback = _callback;
    }

    return {
      cancel() {
        callback = null;
      }
    };
  }

  function callSubscriber(...args) {
    if (callback) {
      callback(...args);
    }
  }

  return {
    callSubscriber,
    subscribe
  };
}

function createTab(type = 'bpmn', name = 'diagram_1.bpmn') {
  return {
    type,
    file: {
      contents: '<?xml version="1.0" encoding="UTF-8"?>',
      name
    }
  };
}