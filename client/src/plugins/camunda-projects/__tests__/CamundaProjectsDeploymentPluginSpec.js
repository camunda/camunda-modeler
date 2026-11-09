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

import CamundaProjectsDeploymentPlugin, { getDeploymentDescription } from '../CamundaProjectsDeploymentPlugin';

import { Slot, SlotFillRoot } from '../../../app/slot-fill';
import { DEFAULT_ENDPOINT } from '../../../app/zeebe/Deployment';

import { Deployment, ZeebeAPI } from '../../../app/__tests__/mocks';

describe('CamundaProjectsDeploymentPlugin', function() {

  it('should not render status bar item by default', function() {

    // when
    const { container } = createCamundaProjectsDeploymentPlugin();

    const statusBarItem = container.querySelector('.btn');

    // then
    expect(statusBarItem).to.be.null;
  });


  it('should render status bar item when active tab can be deployed and Camunda project exists', async function() {

    // when
    const { container } = createCamundaProjectsDeploymentPlugin({
      camundaProject: DEFAULT_CAMUNDA_PROJECT
    });

    // then
    const statusBarItem = container.querySelector('.btn');

    expect(statusBarItem).to.not.be.null;
    expect(statusBarItem.getAttribute('title')).to.equal('Open project deployment');
  });


  it('should render overlay when clicking status bar item', async function() {

    // given
    const triggerAction = sinon.spy(function(action) {
      if (action === 'save-tab') {
        return Promise.resolve(true);
      }
    });

    const { container } = createCamundaProjectsDeploymentPlugin({
      camundaProject: DEFAULT_CAMUNDA_PROJECT,
      triggerAction
    });

    // when
    fireEvent.click(container.querySelector('.btn'));

    // then
    await waitFor(() => {
      const overlay = document.querySelector('[role="dialog"]');

      expect(overlay).to.exist;
    });
  });


  it('should render number of deployed files (singular)', async function() {

    // given
    const triggerAction = sinon.spy(function(action) {
      if (action === 'save-tab') {
        return Promise.resolve(true);
      }
    });

    const { container } = createCamundaProjectsDeploymentPlugin({
      camundaProject: DEFAULT_CAMUNDA_PROJECT,
      resourceConfigs: DEFAULT_RESOURCE_CONFIGS.slice(0, 1),
      triggerAction
    });

    // when
    fireEvent.click(container.querySelector('.btn'));

    await waitFor(() => {
      const overlay = document.querySelector('[role="dialog"]');

      expect(overlay).to.exist;
    });

    // then
    const description = document.querySelector('[role="dialog"] .form-description');

    expect(description.textContent).to.include('1 file will be deployed');
  });


  it('should render number of deployed files (plural)', async function() {

    // given
    const triggerAction = sinon.spy(function(action) {
      if (action === 'save-tab') {
        return Promise.resolve(true);
      }
    });

    const { container } = createCamundaProjectsDeploymentPlugin({
      camundaProject: DEFAULT_CAMUNDA_PROJECT,
      triggerAction
    });

    // when
    fireEvent.click(container.querySelector('.btn'));

    await waitFor(() => {
      const overlay = document.querySelector('[role="dialog"]');

      expect(overlay).to.exist;
    });

    // then
    const description = document.querySelector('[role="dialog"] .form-description');

    expect(description.textContent).to.include('5 files will be deployed');
  });


  it('should not render overlay when clicking status bar item (overlay rendered)', async function() {

    // given
    const triggerAction = sinon.spy(function(action) {
      if (action === 'save-tab') {
        return Promise.resolve(true);
      }
    });

    const { container } = createCamundaProjectsDeploymentPlugin({
      camundaProject: DEFAULT_CAMUNDA_PROJECT,
      triggerAction
    });

    // when
    fireEvent.click(container.querySelector('.btn'));

    // then
    await waitFor(() => {
      const overlay = document.querySelector('[role="dialog"]');

      expect(overlay).to.exist;
    });

    // when
    fireEvent.click(container.querySelector('.btn'));

    await waitFor(() => {
      const overlay = document.querySelector('[role="dialog"]');

      expect(overlay).not.to.exist;
    });
  });


  it('should render error instead of number of deployed files ("Invalid configuration ... error")', async function() {

    // given
    const triggerAction = sinon.spy(function(action) {
      if (action === 'save-tab') {
        return Promise.resolve(true);
      }
    });

    const { container } = createCamundaProjectsDeploymentPlugin({
      camundaProject: DEFAULT_CAMUNDA_PROJECT,
      resourceConfigs: [],
      resourcesError: 'Invalid camunda.json: `deployResources` must be an array of glob patterns.',
      triggerAction
    });

    // when
    fireEvent.click(container.querySelector('.btn'));

    await waitFor(() => {
      expect(document.querySelector('[role="dialog"]')).to.exist;
    });

    // then
    const description = document.querySelector('[role="dialog"] .form-description');

    expect(description.textContent).to.include('Invalid camunda.json: `deployResources` must be an array of glob patterns.');
  });


  describe('resources provider', function() {

    function createDeploymentStub() {
      const providers = [];

      return {
        providers,
        deploy(resourceConfigs) {
          return providers.reduce((configs, provider) => provider(configs), resourceConfigs);
        },
        registerResourcesProvider(provider) {
          providers.push(provider);
        },
        unregisterResourcesProvider(provider) {
          providers.splice(providers.indexOf(provider), 1);
        }
      };
    }

    function createWithDeployment(deployment, props = {}) {
      return createCamundaProjectsDeploymentPlugin({
        _getGlobal: (name) => name === 'deployment' ? deployment : null,
        camundaProject: DEFAULT_CAMUNDA_PROJECT,
        ...props
      });
    }


    it('should add project resources to every deployment in project context (deploy, start instance, task testing)', function() {

      // given
      const deployment = createDeploymentStub();

      createWithDeployment(deployment, { resourceConfigs: DEFAULT_RESOURCE_CONFIGS });

      // when
      // e.g. task testing deploys the active tab only
      const resourceConfigs = deployment.deploy([ { path: 'process.bpmn', type: 'bpmn' } ]);

      // then
      expect(resourceConfigs).to.eql(DEFAULT_RESOURCE_CONFIGS);
    });


    it('should not add anything without open project (excluded file used standalone)', function() {

      // given
      const deployment = createDeploymentStub();

      createWithDeployment(deployment, { camundaProject: null, resourceConfigs: [] });

      // when
      const resourceConfigs = deployment.deploy([ { path: 'excluded.bpmn', type: 'bpmn' } ]);

      // then
      expect(resourceConfigs).to.eql([ { path: 'excluded.bpmn', type: 'bpmn' } ]);
    });


    it('should prevent deployment on project error ("Invalid configuration / empty selection: error, no deployment")', function() {

      // given
      const deployment = createDeploymentStub();

      createWithDeployment(deployment, {
        resourceConfigs: [],
        resourcesError: 'No deployable files found: `deployResources` in camunda.json selects no files.'
      });

      // when
      const deploy = () => deployment.deploy([ { path: 'process.bpmn', type: 'bpmn' } ]);

      // then
      expect(deploy).to.throw('No deployable files found');
    });


    it('should update provider when project resources change (live refresh)', function() {

      // given
      const deployment = createDeploymentStub();

      const { rerender } = createWithDeployment(deployment, { resourceConfigs: DEFAULT_RESOURCE_CONFIGS.slice(0, 1) });

      // when
      rerender({
        _getGlobal: (name) => name === 'deployment' ? deployment : null,
        camundaProject: DEFAULT_CAMUNDA_PROJECT,
        resourceConfigs: DEFAULT_RESOURCE_CONFIGS
      });

      // then
      expect(deployment.providers).to.have.length(1);
      expect(deployment.deploy([])).to.eql(DEFAULT_RESOURCE_CONFIGS);
    });

  });


  describe('#getDeploymentDescription', function() {

    it('should describe number of files', function() {
      expect(getDeploymentDescription(DEFAULT_RESOURCE_CONFIGS.slice(0, 1), null)).to.eql('1 file will be deployed');
      expect(getDeploymentDescription(DEFAULT_RESOURCE_CONFIGS, null)).to.eql('5 files will be deployed');
    });


    it('should describe error', function() {
      expect(getDeploymentDescription([], 'foo')).to.eql('foo');
    });

  });


  it('should forward <emit> to overlay (deployment event)', async function() {

    // given
    const triggerAction = sinon.spy(function(action) {
      if (action === 'save-tab') {
        return Promise.resolve(true);
      }
    });

    const deployment = new Deployment({
      async getConnectionForTab() {
        return DEFAULT_ENDPOINT;
      },
      on: sinon.spy(),
      registerResourcesProvider() {},
      unregisterResourcesProvider() {}
    });

    const emit = sinon.spy();

    const { container } = createCamundaProjectsDeploymentPlugin({
      _getGlobal: (name) => name === 'deployment' ? deployment : new ZeebeAPI(),
      emit,
      camundaProject: DEFAULT_CAMUNDA_PROJECT,
      triggerAction
    });

    // when
    fireEvent.click(container.querySelector('.btn'));

    await waitFor(() => {
      const overlay = document.querySelector('[role="dialog"]');

      expect(overlay).to.exist;
    });

    expect(deployment.on).to.have.been.calledWith('deployed', sinon.match.func);

    // simulating <deployed> event as emitted by the deployment
    deployment.on.getCalls().find(call => call.args[0] === 'deployed').args[1]({
      deploymentResult: { success: true, response: {} },
      endpoint: { targetType: 'camundaCloud' },
      gatewayVersion: '8.0.0'
    });

    // then
    expect(emit).to.have.been.calledWith('deployment.done', sinon.match.object);
  });


  it('should register resources provider', async function() {

    // given
    const registerResourcesProvider = sinon.spy();
    const unregisterResourcesProvider = sinon.spy();

    const getGlobal = (name) => {
      if (name === 'deployment') {
        return new Deployment({
          async getConnectionForTab(file) {
            return DEFAULT_ENDPOINT;
          },
          registerResourcesProvider,
          unregisterResourcesProvider
        });
      } else if (name === 'zeebeAPI') {
        return new ZeebeAPI();
      }
    };

    // when
    const { unmount } = createCamundaProjectsDeploymentPlugin({
      _getGlobal: getGlobal,
      camundaProject: DEFAULT_CAMUNDA_PROJECT
    });

    // then
    await waitFor(() => {
      expect(registerResourcesProvider).to.have.been.calledOnce;
    });

    // when
    unmount();

    // then
    await waitFor(() => {
      expect(unregisterResourcesProvider).to.have.been.calledOnce;
    });
  });


  it('should render overlay on <app.open-deployment>', async function() {

    // given
    let openDeployment;

    const subscribe = sinon.spy(function(event, callback) {
      if (event === 'app.open-deployment') {
        openDeployment = callback;
      }

      return { cancel() {} };
    });

    const triggerAction = sinon.spy(function(action) {
      if (action === 'save-tab') {
        return Promise.resolve(true);
      }
    });

    createCamundaProjectsDeploymentPlugin({
      camundaProject: DEFAULT_CAMUNDA_PROJECT,
      subscribe,
      triggerAction
    });

    // when
    openDeployment({ tab: DEFAULT_ACTIVE_TAB });

    // then
    await waitFor(() => {
      expect(document.querySelector('[role="dialog"]')).to.exist;
    });
  });


  it('should close overlay when status bar item is removed', async function() {

    // given
    const triggerAction = sinon.spy(function(action) {
      if (action === 'save-tab') {
        return Promise.resolve(true);
      }
    });

    const { container, rerender } = createCamundaProjectsDeploymentPlugin({
      camundaProject: DEFAULT_CAMUNDA_PROJECT,
      triggerAction
    });

    fireEvent.click(container.querySelector('.btn'));

    await waitFor(() => {
      expect(document.querySelector('[role="dialog"]')).to.exist;
    });

    // when
    rerender({
      activeTab: { type: 'bpmn' },
      camundaProject: DEFAULT_CAMUNDA_PROJECT,
      triggerAction
    });

    // then
    await waitFor(() => {
      expect(document.querySelector('[role="dialog"]')).not.to.exist;
    });
  });


});

const DEFAULT_CAMUNDA_PROJECT = {
  file: {
    path: 'camunda.json'
  }
};

const DEFAULT_ACTIVE_TAB = {
  type: 'cloud-bpmn'
};

const DEFAULT_ITEMS = [
  {
    file: { path: 'diagram.bpmn' },
    metadata: { type: 'bpmn' }
  },
  {
    file: { path: 'decision.dmn' },
    metadata: { type: 'dmn' }
  },
  {
    file: { path: 'user.form' },
    metadata: { type: 'form' }
  },
  {
    file: { path: 'script.rpa' },
    metadata: { type: 'rpa' }
  },
  {
    file: {
      name: 'camunda.json',
      uri: 'file:///C:/camunda-project/camunda.json',
      path: 'C://camunda-project/camunda.json',
      dirname: 'C://camunda-project',
      contents: '{}'
    },
    metadata: {
      type: 'camundaProject'
    }
  },
  {
    file: {
      name: 'unknown.file'
    },
    metadata: {
      type: 'foo'
    }
  }
];

const DEFAULT_RESOURCE_CONFIGS = [
  { path: 'process.bpmn', type: 'bpmn' },
  { path: 'decision.dmn', type: 'dmn' },
  { path: 'user.form', type: 'form' },
  { path: 'script.rpa', type: 'rpa' },
  { path: 'resources/.prompt.md', type: 'resource' }
];

function createCamundaProjectsDeploymentPlugin(props = {}) {
  const rendered = render(renderCamundaProjectsDeploymentPlugin(props));

  return {
    ...rendered,
    rerender: (newProps) => rendered.rerender(renderCamundaProjectsDeploymentPlugin(newProps))
  };
}

function renderCamundaProjectsDeploymentPlugin(props) {
  const {
    _getGlobal = (name) => {
      if (name === 'deployment') {
        return new Deployment({
          async getConnectionForTab(file) {
            return DEFAULT_ENDPOINT;
          },
          registerResourcesProvider() {},
          unregisterResourcesProvider() {}
        });
      } else if (name === 'zeebeAPI') {
        return new ZeebeAPI();
      }
    },
    activeTab = DEFAULT_ACTIVE_TAB,
    displayNotification = () => {},
    emit = () => {},
    log = () => {},
    camundaProject = null,
    camundaProjectItems = DEFAULT_ITEMS,
    resourceConfigs = DEFAULT_RESOURCE_CONFIGS,
    resourcesError = null,
    subscribe = () => ({ cancel() {} }),
    triggerAction = () => {}
  } = props;

  return <SlotFillRoot>
    <Slot name="status-bar__file" />
    <CamundaProjectsDeploymentPlugin
      _getGlobal={ _getGlobal }
      activeTab={ activeTab }
      displayNotification={ displayNotification }
      emit={ emit }
      log={ log }
      camundaProject={ camundaProject }
      camundaProjectItems={ camundaProjectItems }
      resourceConfigs={ resourceConfigs }
      resourcesError={ resourcesError }
      subscribe={ subscribe }
      triggerAction={ triggerAction } />
  </SlotFillRoot>;
}