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

import CamundaProjectsStartInstancePlugin from '../CamundaProjectsStartInstancePlugin';

import { Slot, SlotFillRoot } from '../../../app/slot-fill';
import { DEFAULT_ENDPOINT } from '../../../app/zeebe/Deployment';

import { Deployment, StartInstance, ZeebeAPI } from '../../../app/__tests__/mocks';

describe('CamundaProjectsStartInstancePlugin', function() {

  it('should not render status bar item by default', function() {

    // when
    const { container } = createCamundaProjectsStartInstancePlugin();

    const statusBarItem = container.querySelector('.btn');

    // then
    expect(statusBarItem).to.be.null;
  });


  it('should render status bar item when active tab can be started and Camunda project exists', async function() {

    // when
    const { container } = createCamundaProjectsStartInstancePlugin({
      camundaProject: DEFAULT_CAMUNDA_PROJECT
    });

    // then
    const statusBarItem = container.querySelector('.btn');

    expect(statusBarItem).to.not.be.null;
    expect(statusBarItem.getAttribute('title')).to.equal('Open project start instance');
  });


  it('should not render status bar item when active tab cannot be started', async function() {

    // when
    const { container } = createCamundaProjectsStartInstancePlugin({
      activeTab: {
        type: 'cloud-dmn'
      },
      camundaProject: DEFAULT_CAMUNDA_PROJECT
    });

    // then
    const statusBarItem = container.querySelector('.btn');

    expect(statusBarItem).to.be.null;
  });


  it('should render overlay when clicking status bar item', async function() {

    // given
    const triggerAction = sinon.spy(function(action) {
      if (action === 'save-tab') {
        return Promise.resolve(true);
      }
    });

    const { container } = createCamundaProjectsStartInstancePlugin({
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


  it('should not render overlay when clicking status bar item (overlay rendered)', async function() {

    // given
    const triggerAction = sinon.spy(function(action) {
      if (action === 'save-tab') {
        return Promise.resolve(true);
      }
    });

    const { container } = createCamundaProjectsStartInstancePlugin({
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


  it('should deploy project resources on start instance ("run ... use(s) the same membership rules")', async function() {

    // given
    const deploySpy = sinon.spy(() => ({ success: false, response: { message: 'stop here' } }));

    const triggerAction = sinon.spy(function(action) {
      if (action === 'save-tab') {
        return Promise.resolve(true);
      }
    });

    const { container } = createCamundaProjectsStartInstancePlugin({
      _getGlobal: (name) => {
        if (name === 'deployment') {
          return new Deployment({
            async getConnectionForTab() {
              return DEFAULT_ENDPOINT;
            },
            deploy: deploySpy
          });
        } else if (name === 'startInstance') {
          return new StartInstance({
            async getConfigForFile() {
              return { variables: '', businessId: '' };
            },
            async setConfigForFile() {}
          });
        }
      },
      camundaProject: DEFAULT_CAMUNDA_PROJECT,
      resourceConfigs: DEFAULT_RESOURCE_CONFIGS,
      triggerAction
    });

    fireEvent.click(container.querySelector('.btn'));

    await waitFor(() => {
      expect(document.querySelector('[role="dialog"] button[type="submit"]')).to.exist;
    });

    // when
    fireEvent.click(document.querySelector('[role="dialog"] button[type="submit"]'));

    // then
    await waitFor(() => {
      expect(deploySpy).to.have.been.calledOnce;
    });

    expect(deploySpy.getCall(0).args[0]).to.eql(DEFAULT_RESOURCE_CONFIGS);
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
      on: sinon.spy()
    });

    const emit = sinon.spy();

    const { container } = createCamundaProjectsStartInstancePlugin({
      _getGlobal: (name) => {
        if (name === 'deployment') {
          return deployment;
        } else if (name === 'startInstance') {
          return new StartInstance({
            async getConnectionForTab() {
              return {};
            }
          });
        } else if (name === 'zeebeAPI') {
          return new ZeebeAPI();
        }
      },
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


  it('should render overlay on <app.open-start-instance>', async function() {

    // given
    let openStartInstance;

    const subscribe = sinon.spy(function(event, callback) {
      if (event === 'app.open-start-instance') {
        openStartInstance = callback;
      }

      return { cancel() {} };
    });

    const triggerAction = sinon.spy(function(action) {
      if (action === 'save-tab') {
        return Promise.resolve(true);
      }
    });

    createCamundaProjectsStartInstancePlugin({
      camundaProject: DEFAULT_CAMUNDA_PROJECT,
      subscribe,
      triggerAction
    });

    // when
    openStartInstance({ tab: DEFAULT_ACTIVE_TAB });

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

    const { container, rerender } = createCamundaProjectsStartInstancePlugin({
      camundaProject: DEFAULT_CAMUNDA_PROJECT,
      triggerAction
    });

    fireEvent.click(container.querySelector('.btn'));

    await waitFor(() => {
      expect(document.querySelector('[role="dialog"]')).to.exist;
    });

    // when
    rerender({
      activeTab: { type: 'cloud-dmn' },
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
  type: 'cloud-bpmn',
  file: {
    name: 'process.bpmn',
    path: 'process.bpmn'
  }
};

const DEFAULT_RESOURCE_CONFIGS = [
  { path: 'process.bpmn', type: 'bpmn' },
  { path: 'decision.dmn', type: 'dmn' },
  { path: 'resources/.prompt.md', type: 'resource' }
];

function createCamundaProjectsStartInstancePlugin(props = {}) {
  const rendered = render(renderCamundaProjectsStartInstancePlugin(props));

  return {
    ...rendered,
    rerender: (newProps) => rendered.rerender(renderCamundaProjectsStartInstancePlugin(newProps))
  };
}

function renderCamundaProjectsStartInstancePlugin(props) {
  const {
    _getGlobal = (name) => {
      if (name === 'deployment') {
        return new Deployment({
          async getConnectionForTab(file) {
            return DEFAULT_ENDPOINT;
          }
        });
      } else if (name === 'startInstance') {
        return new StartInstance({
          async getConnectionForTab(file) {
            return {};
          }
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
    camundaProjectItems = [],
    resourceConfigs = [],
    resourcesError = null,
    subscribe = () => ({ cancel() {} }),
    triggerAction = () => {}
  } = props;

  return <SlotFillRoot>
    <Slot name="status-bar__file" />
    <CamundaProjectsStartInstancePlugin
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