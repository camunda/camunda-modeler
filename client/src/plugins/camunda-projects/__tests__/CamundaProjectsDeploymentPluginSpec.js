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

import CamundaProjectsDeploymentPlugin, { canDeployItem } from '../CamundaProjectsDeploymentPlugin';

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
    expect(statusBarItem.getAttribute('title')).to.equal('Open Camunda project deployment');
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
      camundaProjectItems: DEFAULT_ITEMS.filter((item) => [ 'bpmn', 'camundaProject' ].includes(item.metadata.type)),
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

    expect(description.textContent).to.include('4 files will be deployed');
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


  describe('#canDeployItem', function() {

    it('should allow supported file types', function() {

      // given
      const items = DEFAULT_ITEMS;

      // when
      const canDeploy = items.map(canDeployItem);

      // then
      expect(canDeploy).to.eql([
        true, // bpmn
        true, // dmn
        true, // form
        true, // rpa
        false, // camundaProject
        false // foo
      ]);
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

});

const DEFAULT_CAMUNDA_PROJECT = {
  file: {
    path: 'camunda-project.json'
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
      name: 'camunda-project.json',
      uri: 'file:///C:/camunda-project/camunda-project.json',
      path: 'C://camunda-project/camunda-project.json',
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

function createCamundaProjectsDeploymentPlugin(props = {}) {
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
    triggerAction = () => {}
  } = props;

  return render(<SlotFillRoot>
    <Slot name="status-bar__file" />
    <CamundaProjectsDeploymentPlugin
      _getGlobal={ _getGlobal }
      activeTab={ activeTab }
      displayNotification={ displayNotification }
      emit={ emit }
      log={ log }
      camundaProject={ camundaProject }
      camundaProjectItems={ camundaProjectItems }
      triggerAction={ triggerAction } />
  </SlotFillRoot>);
}