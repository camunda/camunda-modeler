/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { expect } from 'chai';
import * as sinon from 'sinon';

import React from 'react';

import { render, fireEvent, waitFor } from '@testing-library/react';

import CredentialsManager from '../CredentialsManager';

const TEMPLATE = {
  id: 'io.camunda:test:1',
  version: 1,
  properties: [
    {
      id: 'token',
      label: 'API token',
      type: 'String',
      optional: true,
      binding: { type: 'property', name: 'token' }
    }
  ]
};

const INSTANCE_METADATA = {
  displayName: 'My Cred',
  configurationTemplate: 'io.camunda:test:1',
  configurationTemplateVersion: 1
};


describe('<CredentialsManager>', function() {

  it('should render nothing before a chooser event', function() {

    // when
    const { queryByRole } = renderManager();

    // then
    expect(queryByRole('dialog')).not.to.exist;
  });


  it('should feed the selectable instances on mount', async function() {

    // given
    const zeebeApi = createZeebeApi({
      searchClusterVariables: sinon.stub().resolves({
        success: true,
        response: { items: [ { name: 'CRED_A', metadata: INSTANCE_METADATA } ] }
      })
    });

    const { configurationInstances } = renderManager({ zeebeApi });

    // then
    await waitFor(() => {
      const call = fedInstancesCall(configurationInstances);

      expect(call).to.exist;
      expect(call.selectableInstances).to.have.length(1);
    });
  });


  it('should mark the chooser unavailable without a connection', async function() {

    // given
    const deployment = createDeployment({ getConnectionForTab: sinon.stub().resolves(null) });

    const { configurationInstances } = renderManager({ deployment });

    // then
    await waitFor(() => {
      const call = unavailableCall(configurationInstances);

      expect(call).to.exist;
      expect(call.unavailableMessage).to.match(/Connect to a Camunda 8 cluster/);
    });
  });


  it('should open the create modal on configuration.create', async function() {

    // given
    const { eventBus, getByText } = renderManager();

    // when
    eventBus.fire('configuration.create', createEvent());

    // then
    await waitFor(() => {
      expect(getByText('Add credential')).to.exist;
    });
  });


  it('should open the edit modal on configuration.edit', async function() {

    // given
    const { eventBus, getByText } = renderManager();

    // when
    eventBus.fire('configuration.edit', createEvent({ instance: { name: 'MY_CRED', metadata: INSTANCE_METADATA } }));

    // then
    await waitFor(() => {
      expect(getByText('Edit credential')).to.exist;
    });
  });


  it('should open the upgrade modal on configuration.upgrade', async function() {

    // given
    const { eventBus, getByText } = renderManager();

    // when
    eventBus.fire('configuration.upgrade', createEvent({ instance: { name: 'MY_CRED', metadata: INSTANCE_METADATA } }));

    // then
    await waitFor(() => {
      expect(getByText('Upgrade credential')).to.exist;
    });
  });


  it('should create the credential on submit', async function() {

    // given
    const zeebeApi = createZeebeApi();

    const { eventBus, getByRole } = renderManager({ zeebeApi });

    eventBus.fire('configuration.create', createEvent());

    const submit = await waitFor(() => getByRole('button', { name: 'Create and select' }));

    // when
    fireEvent.click(submit);

    // then
    await waitFor(() => {
      expect(zeebeApi.createClusterVariable).to.have.been.calledOnce;
    });
  });


  it('should update the credential on submit', async function() {

    // given
    const zeebeApi = createZeebeApi();

    const { eventBus, getByRole } = renderManager({ zeebeApi });

    eventBus.fire('configuration.edit', createEvent({ instance: { name: 'MY_CRED', metadata: INSTANCE_METADATA } }));

    const submit = await waitFor(() => getByRole('button', { name: 'Save' }));

    // when
    fireEvent.click(submit);

    // then
    await waitFor(() => {
      expect(zeebeApi.updateClusterVariable).to.have.been.calledOnce;
    });
  });

});


// helpers //////////

function createEvent(overrides = {}) {
  return {
    element: { id: 'Task_1', businessObject: { name: 'My Cred' } },
    property: { id: 'cred' },
    configurationTemplate: 'io.camunda:test:1',
    configurationTemplateVersion: 1,
    ...overrides
  };
}

function createEventBus() {
  const listeners = {};

  const eventBus = {
    on(event, callback) {
      (listeners[event] = listeners[event] || []).push(callback);
    },
    off(event, callback) {
      listeners[event] = (listeners[event] || []).filter(listener => listener !== callback);
    }
  };

  eventBus.fire = sinon.spy((event, data) => {
    (listeners[event] || []).forEach(callback => callback(data));
  });

  return eventBus;
}

function createConfigurationInstances() {
  return {
    setState: sinon.spy(),
    getSelectableInstances: () => [],
    getReferencedInstanceByName: () => null
  };
}

function createConfigurationTemplates() {
  return {
    get: sinon.stub().returns(TEMPLATE)
  };
}

function createZeebeApi(overrides = {}) {
  return {
    getAuthorizations: sinon.stub().resolves({ success: true, response: { items: [] } }),
    searchClusterVariables: sinon.stub().resolves({ success: true, response: { items: [] } }),
    getClusterVariable: sinon.stub().resolves({ success: true, response: { metadata: {}, value: {} } }),
    createClusterVariable: sinon.stub().resolves({ success: true }),
    updateClusterVariable: sinon.stub().resolves({ success: true }),
    listSecrets: sinon.stub().resolves({ success: true, response: { references: [] } }),
    ...overrides
  };
}

function createDeployment(overrides = {}) {
  return {
    getConnectionForTab: sinon.stub().resolves({ id: 'cluster' }),
    ...overrides
  };
}

function renderManager(overrides = {}) {
  const eventBus = overrides.eventBus || createEventBus();
  const configurationInstances = overrides.configurationInstances || createConfigurationInstances();
  const configurationTemplates = overrides.configurationTemplates || createConfigurationTemplates();
  const elementRegistry = overrides.elementRegistry || { getAll: () => [] };
  const zeebeApi = overrides.zeebeApi || createZeebeApi();
  const deployment = overrides.deployment || createDeployment();
  const onError = overrides.onError || sinon.spy();

  const services = { eventBus, configurationInstances, configurationTemplates, elementRegistry };

  const injector = {
    get(name, strict = true) {
      if (name in services) {
        return services[name];
      }

      if (strict) {
        throw new Error('service not found: ' + name);
      }

      return null;
    }
  };

  const result = render(
    <CredentialsManager
      injector={ injector }
      zeebeApi={ zeebeApi }
      deployment={ deployment }
      file={ overrides.file || {} }
      onError={ onError }
    />
  );

  return { eventBus, configurationInstances, configurationTemplates, zeebeApi, deployment, onError, ...result };
}

function fedInstancesCall(configurationInstances) {
  const call = configurationInstances.setState.getCalls().find(call => call.args[0].selectableInstances);

  return call && call.args[0];
}

function unavailableCall(configurationInstances) {
  const call = configurationInstances.setState.getCalls().find(call => call.args[0].unavailableMessage);

  return call && call.args[0];
}
