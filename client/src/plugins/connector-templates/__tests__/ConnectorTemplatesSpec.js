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

import React from 'react';

import { shallow } from 'enzyme';

import ConnectorTemplates from '..';

import { Backend } from '../../../app/__tests__/mocks';

describe('<ConnectorTemplates>', function() {

  it('should render', function() {
    createConnectorTemplates();
  });


  it('should show success notification (connector templates updated) on success and trigger reload of element templates', async function() {

    // given
    const backend = new Backend();

    const displayNotificationSpy = sinon.spy();

    const triggerActionSpy = sinon.spy();

    await createConnectorTemplates({
      _getGlobal: () => backend,
      displayNotification: displayNotificationSpy,
      triggerAction: triggerActionSpy
    });

    // when
    backend.receive('client:connector-templates-update-success', null, true);

    // then
    expect(displayNotificationSpy).to.have.been.calledWithMatch({ type: 'success', title: 'Camunda Connector templates updated' });

    expect(triggerActionSpy).to.have.been.calledWith('elementTemplates.reload');
  });


  it('should show success notification (connector templates up to date) on success and trigger reload of element templates', async function() {

    // given
    const backend = new Backend();

    const displayNotificationSpy = sinon.spy();

    const triggerActionSpy = sinon.spy();

    await createConnectorTemplates({
      _getGlobal: () => backend,
      displayNotification: displayNotificationSpy,
      triggerAction: triggerActionSpy
    });

    // when
    backend.receive('client:connector-templates-update-success', null, false);

    // then
    expect(displayNotificationSpy).to.have.been.calledWithMatch({ type: 'success', title: 'Camunda Connector templates up to date' });

    expect(triggerActionSpy).to.have.been.calledWith('elementTemplates.reload');
  });


  it('should show success notification with warnings on success with warnings', async function() {

    // given
    const backend = new Backend();

    const displayNotificationSpy = sinon.spy();

    const triggerActionSpy = sinon.spy();

    await createConnectorTemplates({
      _getGlobal: () => backend,
      displayNotification: displayNotificationSpy,
      triggerAction: triggerActionSpy
    });

    // when
    backend.receive('client:connector-templates-update-success', null, true, [ 'foo', 'bar' ]);

    // then
    expect(displayNotificationSpy).to.have.been.calledWithMatch({ type: 'warning', title: 'Camunda Connector templates updated with warnings' });
    expect(displayNotificationSpy.args[0][0].content).to.exist;
  });


  it('should show error notification on error', async function() {

    // given
    const backend = new Backend();

    const displayNotificationSpy = sinon.spy();

    const triggerActionSpy = sinon.spy();

    await createConnectorTemplates({
      _getGlobal: () => backend,
      displayNotification: displayNotificationSpy,
      triggerAction: triggerActionSpy
    });

    // when
    backend.receive('client:connector-templates-update-error', null, 'error');

    // then
    expect(displayNotificationSpy).to.have.been.calledWithMatch({ type: 'error', title: 'Error updating Camunda Connector templates' });
    expect(displayNotificationSpy.args[0][0].content).to.exist;
  });

});

async function createConnectorTemplates(props = {}) {
  const wrapper = shallow(<ConnectorTemplates { ...{
    _getGlobal: () => {},
    displayNotification: () => {},
    subscribe: () => {},
    triggerAction: () => {},
    ...props
  } } />);

  wrapper.setState({
    activeTab: createTab()
  });

  const instance = wrapper.instance();

  return {
    instance,
    wrapper
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