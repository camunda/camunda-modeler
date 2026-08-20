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

import CredentialManager from '../CredentialManager';
import { EventsContext } from '../../../../EventsContext';

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

const SECRET_TEMPLATE = {
  ...TEMPLATE,
  properties: [
    {
      ...TEMPLATE.properties[0],
      secret: true
    }
  ]
};

const INSTANCE_METADATA = {
  displayName: 'My Cred',
  configurationTemplate: 'io.camunda:test:1',
  configurationTemplateVersion: 1
};


describe('<CredentialManager>', function() {

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


  it('should search credentials per configuration template', async function() {

    // given
    const elements = [ { id: 'Task_1' }, { id: 'Task_2' } ];
    const elementRegistry = { getAll: () => elements };
    const elementTemplates = createElementTemplates(element => ({
      properties: [ {
        type: 'Configuration',
        configurationTemplate: element.id === 'Task_1' ? 'template-a' : 'template-b'
      } ]
    }));
    const zeebeApi = createZeebeApi();

    renderManager({ elementRegistry, elementTemplates, zeebeApi });

    // then
    await waitFor(() => {
      expect(zeebeApi.searchClusterVariables).to.have.been.calledTwice;
    });

    expect(zeebeApi.searchClusterVariables).to.have.been.calledWithMatch({}, {
      metadata: {
        kind: { '$eq': 'CREDENTIAL' },
        configurationTemplate: { '$eq': 'template-a' }
      }
    });
    expect(zeebeApi.searchClusterVariables).to.have.been.calledWithMatch({}, {
      metadata: {
        kind: { '$eq': 'CREDENTIAL' },
        configurationTemplate: { '$eq': 'template-b' }
      }
    });
  });


  it('should load all credential and authorization pages', async function() {

    // given
    const getAuthorizations = sinon.stub();
    getAuthorizations.onFirstCall().resolves({
      success: true,
      response: {
        items: [ { permissionTypes: [ 'CREATE' ] } ],
        page: { endCursor: 'authorizations-page-2' }
      }
    });
    getAuthorizations.onSecondCall().resolves({
      success: true,
      response: {
        items: [ { permissionTypes: [ 'UPDATE' ] } ],
        page: {}
      }
    });

    const searchClusterVariables = sinon.stub();
    searchClusterVariables.onFirstCall().resolves({
      success: true,
      response: {
        items: [ { name: 'CRED_A', metadata: INSTANCE_METADATA } ],
        page: { endCursor: 'credentials-page-2' }
      }
    });
    searchClusterVariables.onSecondCall().resolves({
      success: true,
      response: {
        items: [ { name: 'CRED_B', metadata: INSTANCE_METADATA } ],
        page: {}
      }
    });

    const zeebeApi = createZeebeApi({ getAuthorizations, searchClusterVariables });
    const { configurationInstances } = renderManager({ zeebeApi });

    // then
    await waitFor(() => {
      const call = fedInstancesCall(configurationInstances);

      expect(call.selectableInstances.map(instance => instance.name)).to.eql([ 'CRED_A', 'CRED_B' ]);
      expect(call.permissions).to.eql({ create: true, update: true });
    });

    expect(getAuthorizations.secondCall.args[2]).to.eql({
      after: 'authorizations-page-2',
      limit: 100
    });
    expect(searchClusterVariables.secondCall.args[2]).to.eql({
      after: 'credentials-page-2',
      limit: 100
    });
  });


  it('should not query credentials without Configuration properties', async function() {

    // given
    const elementRegistry = { getAll: () => [] };
    const zeebeApi = createZeebeApi();
    const { configurationInstances } = renderManager({ elementRegistry, zeebeApi });

    // then
    await waitFor(() => {
      expect(configurationInstances.setState).to.have.been.calledWithMatch({
        available: false,
        loading: false,
        error: false,
        selectableInstances: [],
        referencedInstances: []
      });
    });

    expect(zeebeApi.getAuthorizations).not.to.have.been.called;
    expect(zeebeApi.searchClusterVariables).not.to.have.been.called;
  });


  it('should query credentials after diagram import', async function() {

    // given
    const elements = [];
    const elementRegistry = { getAll: () => elements };
    const zeebeApi = createZeebeApi();
    const { eventBus } = renderManager({ elementRegistry, zeebeApi });

    await waitFor(() => {
      expect(zeebeApi.searchClusterVariables).not.to.have.been.called;
    });

    elements.push({ id: 'Task_1' });

    // when
    eventBus.fire('import.done');

    // then
    await waitFor(() => {
      expect(zeebeApi.searchClusterVariables).to.have.been.calledOnce;
    });

    expect(zeebeApi.searchClusterVariables).to.have.been.calledWithMatch({}, {
      metadata: {
        kind: { '$eq': 'CREDENTIAL' },
        configurationTemplate: { '$eq': TEMPLATE.id }
      }
    });
  });


  it('should query credentials after element templates change', async function() {

    // given
    let elementTemplate = null;
    const elementTemplates = createElementTemplates(() => elementTemplate);
    const zeebeApi = createZeebeApi();
    const { eventBus } = renderManager({ elementTemplates, zeebeApi });

    await waitFor(() => {
      expect(zeebeApi.searchClusterVariables).not.to.have.been.called;
    });

    elementTemplate = {
      properties: [ {
        type: 'Configuration',
        configurationTemplate: TEMPLATE.id
      } ]
    };

    // when
    eventBus.fire('elementTemplates.changed');

    // then
    await waitFor(() => {
      expect(zeebeApi.searchClusterVariables).to.have.been.calledOnce;
    });
  });


  it('should serialize concurrent credential reloads', async function() {

    // given
    let resolveSearch;
    const firstSearch = new Promise(resolve => {
      resolveSearch = resolve;
    });
    const searchClusterVariables = sinon.stub();
    searchClusterVariables.onFirstCall().returns(firstSearch);
    searchClusterVariables.onSecondCall().resolves({ success: true, response: { items: [] } });

    const zeebeApi = createZeebeApi({ searchClusterVariables });
    const { eventBus } = renderManager({ zeebeApi });

    await waitFor(() => {
      expect(searchClusterVariables).to.have.been.calledOnce;
    });

    // when
    eventBus.fire('import.done');
    eventBus.fire('elementTemplates.changed');

    expect(searchClusterVariables).to.have.been.calledOnce;

    resolveSearch({ success: true, response: { items: [] } });

    // then
    await waitFor(() => {
      expect(searchClusterVariables).to.have.been.calledTwice;
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


  [
    [ 400, /Camunda 8\.10 or later/ ],
    [ 404, /Camunda 8\.10 or later/ ],
    [ undefined, /Cannot reach the cluster/ ]
  ].forEach(([ status, unavailableMessage ]) => {

    it(`should mark the chooser unavailable for a failed credential search (${ status || 'offline' })`,
      async function() {

        // given
        const zeebeApi = createZeebeApi({
          searchClusterVariables: sinon.stub().resolves({ success: false, status })
        });
        const { configurationInstances } = renderManager({ zeebeApi });

        // then
        await waitFor(() => {
          const call = unavailableCall(configurationInstances);

          expect(call.unavailableMessage).to.match(unavailableMessage);
        });
      });
  });


  it('should feed permissions and referenced credentials', async function() {

    // given
    const metadata = { ...INSTANCE_METADATA };
    const elementRegistry = {
      getAll: () => [ elementWithReferences([ 'CRED_A', 'CRED_B' ]) ]
    };
    const zeebeApi = createZeebeApi({
      getAuthorizations: sinon.stub().resolves({
        success: true,
        response: { items: [ { permissionTypes: [ 'CREATE', 'UPDATE' ] } ] }
      }),
      searchClusterVariables: sinon.stub().resolves({
        success: true,
        response: { items: [ { name: 'CRED_A', metadata } ] }
      }),
      getClusterVariable: sinon.stub().resolves({
        success: true,
        response: { metadata }
      })
    });
    const { configurationInstances } = renderManager({ elementRegistry, zeebeApi });

    // then
    await waitFor(() => {
      const call = fedInstancesCall(configurationInstances);

      expect(call.permissions).to.eql({ create: true, update: true });
      expect(call.referencedInstances.map(instance => instance.name)).to.eql([ 'CRED_A', 'CRED_B' ]);
      expect(zeebeApi.getClusterVariable).to.have.been.calledWithMatch({}, 'CRED_B');
    });
  });


  it('should grant full permissions when authorizations are disabled', async function() {

    // given
    const getAuthorizations = sinon.stub().resolves({
      success: true,
      response: { items: [] }
    });
    const getCurrentUser = sinon.stub().resolves({
      success: true,
      response: { authorizedComponents: [ '*' ] }
    });

    const zeebeApi = createZeebeApi({ getAuthorizations, getCurrentUser });
    const { configurationInstances } = renderManager({ zeebeApi });

    // then
    await waitFor(() => {
      const call = fedInstancesCall(configurationInstances);

      expect(call.permissions).to.eql({ create: true, update: true });
    });

    // does not fall back to the authorization search
    expect(getAuthorizations).not.to.have.been.called;
  });


  it('should derive permissions from search when authorizations are enabled', async function() {

    // given
    const getAuthorizations = sinon.stub().resolves({
      success: true,
      response: { items: [ { permissionTypes: [ 'CREATE' ] } ] }
    });
    const getCurrentUser = sinon.stub().resolves({
      success: true,
      response: { authorizedComponents: [ 'operate', 'tasklist' ] }
    });

    const zeebeApi = createZeebeApi({ getAuthorizations, getCurrentUser });
    const { configurationInstances } = renderManager({ zeebeApi });

    // then
    await waitFor(() => {
      const call = fedInstancesCall(configurationInstances);

      expect(call.permissions).to.eql({ create: true, update: false });
    });

    expect(getAuthorizations).to.have.been.called;
  });


  it('should reload credentials for each connection status event', async function() {

    // given
    let connectionStatusListener;

    const subscribe = sinon.stub().callsFake((event, listener) => {
      if (event === 'connectionManager.connectionStatusChanged') {
        connectionStatusListener = listener;
      }

      return { cancel: sinon.spy() };
    });
    const zeebeApi = createZeebeApi();

    renderManager({ subscribe, zeebeApi });

    await waitFor(() => {
      expect(zeebeApi.searchClusterVariables).to.have.been.calledOnce;
    });

    // when
    connectionStatusListener({ connectionId: 'cluster', success: true });
    connectionStatusListener({ connectionId: 'cluster', success: true });

    // then
    await waitFor(() => {
      expect(zeebeApi.searchClusterVariables).to.have.callCount(3);
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


  it('should suggest a display name and credential ID from the element name', async function() {

    // given
    const { eventBus, getByLabelText } = renderManager();

    // when
    eventBus.fire('configuration.create', createEvent({
      element: { id: 'Task_1', businessObject: { name: 'My credential' } }
    }));

    // then
    await waitFor(() => {
      expect(getByLabelText('Credential name').value).to.equal('My credential');
      expect(getByLabelText('Credential ID *').value).to.equal('MY_CREDENTIAL');
    });
  });


  it('should prevent creating a duplicate credential', async function() {

    // given
    const configurationInstances = createConfigurationInstances({
      selectableInstances: [ {
        name: 'MY_CRED',
        metadata: INSTANCE_METADATA
      } ]
    });
    const { eventBus, getByRole, getByText } = renderManager({ configurationInstances });

    // when
    eventBus.fire('configuration.create', createEvent());

    // then
    await waitFor(() => {
      expect(getByRole('button', { name: 'Create and select' }).disabled).to.be.true;
      expect(getByText(/A credential with this name already exists/)).to.exist;
      expect(getByText(/A credential with this ID already exists/)).to.exist;
    });
  });


  it('should open the create modal before loading secret references', async function() {

    // given
    const listSecrets = sinon.stub().returns(new Promise(() => {}));
    const zeebeApi = createZeebeApi({ listSecrets });
    const configurationTemplates = createConfigurationTemplates(SECRET_TEMPLATE);
    const { eventBus, getByText } = renderManager({ zeebeApi, configurationTemplates });

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


  it('should open the edit modal before loading saved values', async function() {

    // given
    const getClusterVariable = sinon.stub().returns(new Promise(() => {}));
    const zeebeApi = createZeebeApi({ getClusterVariable });
    const { eventBus, getByText, getByRole } = renderManager({ zeebeApi });

    // when
    eventBus.fire('configuration.edit', createEvent({ instance: { name: 'MY_CRED', metadata: INSTANCE_METADATA } }));

    // then
    await waitFor(() => {
      expect(getByText('Edit credential')).to.exist;
      expect(getByRole('button', { name: 'Save' }).disabled).to.be.true;
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


  it('should create the credential with native typed values', async function() {

    // given
    const configurationTemplate = {
      ...TEMPLATE,
      properties: [
        {
          id: 'count',
          label: 'Count',
          type: 'Number',
          value: 42,
          binding: { type: 'property', name: 'count' }
        },
        {
          id: 'enabled',
          label: 'Enabled',
          type: 'Boolean',
          value: false,
          binding: { type: 'property', name: 'enabled' }
        }
      ]
    };
    const configurationTemplates = createConfigurationTemplates(configurationTemplate);
    const zeebeApi = createZeebeApi();
    const { eventBus, getByRole } = renderManager({ configurationTemplates, zeebeApi });

    eventBus.fire('configuration.create', createEvent());

    const submit = await waitFor(() => getByRole('button', { name: 'Create and select' }));

    // when
    fireEvent.click(submit);

    // then
    await waitFor(() => {
      expect(zeebeApi.createClusterVariable).to.have.been.calledWithMatch({}, {
        value: {
          count: 42,
          enabled: false
        }
      });
    });
  });


  it('should optimistically register a created credential', async function() {

    // given
    const configurationInstances = createConfigurationInstances({ selectableInstances: [ { name: 'EXISTING' } ] });
    const { eventBus, getByRole } = renderManager({ configurationInstances });

    eventBus.fire('configuration.create', createEvent());

    const submit = await waitFor(() => getByRole('button', { name: 'Create and select' }));

    // when
    fireEvent.click(submit);

    // then
    await waitFor(() => {
      const call = configurationInstances.setState.getCalls().find(call => {
        const { selectableInstances } = call.args[0];

        return selectableInstances && selectableInstances.some(instance => instance.name === 'EXISTING');
      });

      expect(call).to.exist;
      expect(call.args[0].selectableInstances).to.have.length(2);
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


  it('should show an error when credential submission fails', async function() {

    // given
    const zeebeApi = createZeebeApi({
      createClusterVariable: sinon.stub().resolves({ success: false, reason: 'Denied' })
    });
    const { eventBus, getByRole } = renderManager({ zeebeApi });

    eventBus.fire('configuration.create', createEvent());

    const submit = await waitFor(() => getByRole('button', { name: 'Create and select' }));

    // when
    fireEvent.click(submit);

    // then
    await waitFor(() => {
      expect(getByRole('alert').textContent).to.equal('Denied');
    });
  });


  it('should show a permission error when credential creation is forbidden', async function() {

    // given
    const zeebeApi = createZeebeApi({
      createClusterVariable: sinon.stub().resolves({ success: false, reason: 'FORBIDDEN' })
    });
    const { eventBus, getByRole } = renderManager({ zeebeApi });

    eventBus.fire('configuration.create', createEvent());

    const submit = await waitFor(() => getByRole('button', { name: 'Create and select' }));

    // when
    fireEvent.click(submit);

    // then
    await waitFor(() => {
      expect(getByRole('alert').textContent).to.equal(
        'You do not have permission to create credentials on this cluster. Contact your cluster administrator.'
      );
    });
  });


  it('should show a permission error when credential update is forbidden', async function() {

    // given
    const zeebeApi = createZeebeApi({
      updateClusterVariable: sinon.stub().resolves({ success: false, reason: 'FORBIDDEN' })
    });
    const { eventBus, getByRole } = renderManager({ zeebeApi });

    eventBus.fire('configuration.edit', createEvent({
      instance: { name: 'MY_CRED', metadata: INSTANCE_METADATA }
    }));

    const submit = await waitFor(() => getByRole('button', { name: 'Save' }));

    // when
    fireEvent.click(submit);

    // then
    await waitFor(() => {
      expect(getByRole('alert').textContent).to.equal(
        'You do not have permission to update credentials on this cluster. Contact your cluster administrator.'
      );
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

function createConfigurationInstances(overrides = {}) {
  const selectableInstances = overrides.selectableInstances || [];
  const referencedInstances = overrides.referencedInstances || [];

  return {
    setState: sinon.spy(),
    getSelectableInstances: () => selectableInstances,
    getReferencedInstanceByName: name => referencedInstances.find(instance => instance.name === name) || null
  };
}

function createConfigurationTemplates(template = TEMPLATE) {
  return {
    get: sinon.stub().returns(template)
  };
}

function createElementTemplates(get = () => ({
  properties: [ {
    type: 'Configuration',
    configurationTemplate: TEMPLATE.id
  } ]
})) {
  return { get };
}

function createZeebeApi(overrides = {}) {
  return {
    getAuthorizations: sinon.stub().resolves({ success: true, response: { items: [] } }),
    getCurrentUser: sinon.stub().resolves({ success: true, response: { authorizedComponents: [] } }),
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
  const elementRegistry = overrides.elementRegistry || { getAll: () => [ { id: 'Task_1' } ] };
  const elementTemplates = overrides.elementTemplates || createElementTemplates();
  const zeebeApi = overrides.zeebeApi || createZeebeApi();
  const deployment = overrides.deployment || createDeployment();
  const onError = overrides.onError || sinon.spy();
  const subscribe = overrides.subscribe;

  const services = {
    eventBus,
    configurationInstances,
    configurationTemplates,
    elementRegistry,
    elementTemplates
  };

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

  const manager = (
    <CredentialManager
      injector={ injector }
      zeebeApi={ zeebeApi }
      deployment={ deployment }
      file={ overrides.file || {} }
      onError={ onError }
    />
  );

  const result = render(
    subscribe
      ? <EventsContext.Provider value={ { subscribe } }>{ manager }</EventsContext.Provider>
      : manager
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

function elementWithReferences(names) {
  return {
    businessObject: {
      get(property) {
        if (property !== 'extensionElements') {
          return null;
        }

        return {
          get() {
            return [ {
              $instanceOf: type => type === 'zeebe:IoMapping',
              get: property => property === 'inputParameters'
                ? names.map(name => ({ get: () => `=camunda.vars.env.${ name }` }))
                : []
            } ];
          }
        };
      }
    }
  };
}
