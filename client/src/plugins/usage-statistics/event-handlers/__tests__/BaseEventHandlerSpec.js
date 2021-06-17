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

import BaseEventHandler from '../BaseEventHandler';

const noop = () => {};

describe('<BaseEventHandler>', () => {

  it('should enable', () => {

    // given
    const baseEventHandler = new BaseEventHandler('testEvent', noop);

    // when
    baseEventHandler.enable();

    // then
    expect(baseEventHandler.isEnabled()).to.eql(true);
  });


  it('should disable', () => {

    // given
    const baseEventHandler = new BaseEventHandler('testEvent', noop);

    // when
    baseEventHandler.enable();
    baseEventHandler.disable();

    // then
    expect(baseEventHandler.isEnabled()).to.eql(false);
  });


  it('should execute onAfterEnable', () => {

    // given
    const baseEventHandler = new BaseEventHandler('testEvent', noop);

    const onAfterEnableSpy = sinon.spy();

    baseEventHandler.onAfterEnable = onAfterEnableSpy;

    // when
    baseEventHandler.enable();

    // then
    expect(onAfterEnableSpy).to.have.been.calledOnce;
  });


  it('should execute onAfterDisable', () => {

    // given
    const baseEventHandler = new BaseEventHandler('testEvent', noop);

    const onAfterDisableSpy = sinon.spy();

    baseEventHandler.onAfterDisable = onAfterDisableSpy;

    // when
    baseEventHandler.enable();
    baseEventHandler.disable();

    // then
    expect(onAfterDisableSpy).to.have.been.calledOnce;
  });


  it('should send to ET', () => {

    // given
    const sendSpy = sinon.spy();

    const baseEventHandler = new BaseEventHandler('testEvent', sendSpy);

    // when
    baseEventHandler.enable();

    baseEventHandler.sendToET({ testData: true });

    // then
    expect(sendSpy).to.have.been.calledWith({
      event: 'testEvent',
      testData: true
    });
  });


  it('should not send if not enabled', () => {

    // given
    const sendSpy = sinon.spy();

    const baseEventHandler = new BaseEventHandler('testEvent', sendSpy);

    // when
    baseEventHandler.sendToET({ testData: true });

    // then
    expect(sendSpy).to.not.have.been.called;
  });


  describe('hooks', () => {

    it('should call <onAfterEnable>', () => {

      // given
      const spy = sinon.spy();
      class TestHandler extends BaseEventHandler {
        onAfterEnable() {
          spy();
        }
      }
      const testHandler = new TestHandler('test', noop);

      // when
      testHandler.enable();

      // then
      expect(spy).to.have.been.calledOnce;
    });


    it('should call <onAfterDisable>', () => {

      // given
      const spy = sinon.spy();
      class TestHandler extends BaseEventHandler {
        onAfterDisable() {
          spy();
        }
      }
      const testHandler = new TestHandler('test', noop);

      // when
      testHandler.disable();

      // then
      expect(spy).to.have.been.calledOnce;
    });
  });
});
