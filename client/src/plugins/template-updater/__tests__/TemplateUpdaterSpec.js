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

import { act, render, waitFor } from '@testing-library/react';

import TemplateUpdater from '..';

import { Backend } from '../../../app/__tests__/mocks';

describe('<TemplateUpdater>', function() {

  it('should render', function() {
    createTemplateUpdater();
  });


  it('should update templates on execution platform change', async function() {

    // given
    const backend = new Backend({
      send: sinon.spy()
    });

    let callback;

    await createTemplateUpdater({
      _getGlobal: () => backend,
      subscribe: (event, c) => {
        if (event === 'tab.engineProfileChanged') {
          callback = c;
        }
      }
    });

    // when
    callback({
      executionPlatform: 'camunda',
      executionPlatformVersion: '8.8'
    });

    // then
    expect(backend.send).to.have.been.calledWith('client:templates-update', {
      executionPlatform: 'camunda',
      executionPlatformVersion: '8.8'
    });
  });


  it('should not update templates on execution platform change (no version)', async function() {

    // given
    const backend = new Backend({
      send: sinon.spy()
    });

    let callback;

    await createTemplateUpdater({
      _getGlobal: () => backend,
      subscribe: (event, c) => {
        if (event === 'tab.engineProfileChanged') {
          callback = c;
        }
      }
    });

    // when
    callback({
      executionPlatform: 'camunda'
    });

    // then
    expect(backend.send).not.to.have.been.called;
  });


  it('should show success notification (connector templates updated) on success and trigger reload of element templates', async function() {

    // given
    const backend = new Backend();

    const displayNotificationSpy = sinon.spy();

    const triggerActionSpy = sinon.spy();

    await createTemplateUpdater({
      _getGlobal: () => backend,
      displayNotification: displayNotificationSpy,
      triggerAction: triggerActionSpy
    });

    // when
    backend.receive('client:templates-update-done', null, true);

    // then
    await waitFor(() => {
      expect(displayNotificationSpy).to.have.been.calledWithMatch({ type: 'success', title: 'Camunda Connector templates updated' });
      expect(triggerActionSpy).to.have.been.calledWith('elementTemplates.reload');
    });
  });


  it('should not show notification (connector templates up to date) on success and not trigger reload of element templates', async function() {

    // given
    const backend = new Backend();

    const displayNotificationSpy = sinon.spy();

    const triggerActionSpy = sinon.spy();

    await createTemplateUpdater({
      _getGlobal: () => backend,
      displayNotification: displayNotificationSpy,
      triggerAction: triggerActionSpy
    });

    // when
    backend.receive('client:templates-update-done', null, false);

    // then
    expect(displayNotificationSpy).to.not.have.been.called;

    expect(triggerActionSpy).not.to.have.been.called;
  });


  it('should show success notification and log warnings on success with warnings', async function() {

    // given
    const backend = new Backend();

    const displayNotificationSpy = sinon.spy();

    const logSpy = sinon.spy();

    const triggerActionSpy = sinon.spy();

    await createTemplateUpdater({
      _getGlobal: () => backend,
      displayNotification: displayNotificationSpy,
      log: logSpy,
      triggerAction: triggerActionSpy
    });

    // when
    backend.receive('client:templates-update-done', null, true, [ 'foo', 'bar' ]);

    // then
    expect(displayNotificationSpy).to.have.been.calledWithMatch({ type: 'warning', title: 'Camunda Connector templates updated with errors' });

    expect(logSpy).to.have.been.calledTwice;
    expect(logSpy.args[0][0]).to.include({ category: 'templates-update-error', message: 'foo' });
    expect(logSpy.args[1][0]).to.include({ category: 'templates-update-error', message: 'bar' });
  });

});

async function createTemplateUpdater(props = {}) {
  const ref = createRef();

  render(<TemplateUpdater ref={ ref } { ...{
    _getGlobal: () => {},
    displayNotification: () => {},
    log: () => {},
    subscribe: () => {},
    triggerAction: () => {},
    ...props
  } } />);

  const instance = ref.current;

  await act(async () => {
    instance.setState({
      activeTab: createTab()
    });
  });

  return {
    instance
  };
}

function createTab(type = 'cloud-bpmn', name = 'diagram_1.bpmn') {
  return {
    type,
    file: {
      contents: '<?xml version="1.0" encoding="UTF-8"?>',
      name
    }
  };
}