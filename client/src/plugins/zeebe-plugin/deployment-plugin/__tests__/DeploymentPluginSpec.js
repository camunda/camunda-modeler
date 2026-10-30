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

import { fireEvent, render, waitFor } from '@testing-library/react';

import DeploymentPlugin from '../DeploymentPlugin';

import { Fill, Slot, SlotFillRoot } from '../../../../app/slot-fill';
import { DEFAULT_ENDPOINT } from '../../../../app/zeebe/Deployment';

import { Deployment, ZeebeAPI } from '../../../../app/__tests__/mocks';

describe('DeploymentPlugin', function() {

  it('should not render status bar item by default', function() {

    // when
    const { queryByTitle } = createDeploymentPlugin();

    const statusBarItem = queryByTitle('Open file deployment');
    expect(statusBarItem).to.not.exist;
  });


  it('should render status bar item when active tab can be deployed', async function() {

    // given
    const subscribe = sinon.spy(function(event, callback) {
      if (event === 'app.activeTabChanged') {
        callback({
          activeTab: DEFAULT_ACTIVE_TAB
        });
      }
    });

    // when
    const { queryByTitle } = createDeploymentPlugin({ subscribe });

    // then
    const statusBarItem = queryByTitle('Open file deployment');
    expect(statusBarItem).to.exist;
  });


  it('should render overlay when clicking status bar item', async function() {

    // given
    const subscribe = sinon.spy(function(event, callback) {
      if (event === 'app.activeTabChanged') {
        callback({
          activeTab: DEFAULT_ACTIVE_TAB
        });
      }
    });

    const triggerAction = sinon.spy(function(action) {
      if (action === 'save-tab') {
        return Promise.resolve(true);
      }
    });

    const { getByTitle, getByRole } = createDeploymentPlugin({ subscribe, triggerAction });

    // when
    const statusBarItem = getByTitle('Open file deployment');
    fireEvent.click(statusBarItem);

    // then
    await waitFor(() => {
      const overlay = getByRole('dialog');
      expect(overlay).to.exist;
    });
  });


  it('should not render overlay when clicking status bar item (overlay rendered)', async function() {

    // given
    const subscribe = sinon.spy(function(event, callback) {
      if (event === 'app.activeTabChanged') {
        callback({
          activeTab: DEFAULT_ACTIVE_TAB
        });
      }
    });

    const triggerAction = sinon.spy(function(action) {
      if (action === 'save-tab') {
        return Promise.resolve(true);
      }
    });

    const { getByTitle, getByRole, queryByRole } = createDeploymentPlugin({ subscribe, triggerAction });

    // when
    const statusBarItem = getByTitle('Open file deployment');
    fireEvent.click(statusBarItem);

    // expect
    await waitFor(() => {
      const overlay = getByRole('dialog');
      expect(overlay).to.exist;
    });

    // when
    fireEvent.click(statusBarItem);

    // then
    await waitFor(() => {
      const overlay = queryByRole('dialog');
      expect(overlay).not.to.exist;
    });
  });


  it('should forward <emit> to overlay (deployment event)', async function() {

    // given
    const subscribe = sinon.spy(function(event, callback) {
      if (event === 'app.activeTabChanged') {
        callback({
          activeTab: DEFAULT_ACTIVE_TAB
        });
      }
    });

    const triggerAction = sinon.spy(function(action) {
      if (action === 'save-tab') {
        return Promise.resolve(true);
      }
    });

    const deployment = new Deployment({
      async getConnectionForTab() {
        return { deployment: {}, endpoint: DEFAULT_ENDPOINT };
      },
      on: sinon.spy()
    });

    const emit = sinon.spy();

    const { getByTitle, getByRole } = createDeploymentPlugin({
      subscribe,
      triggerAction,
      emit,
      _getGlobal: (name) => name === 'deployment' ? deployment : undefined
    });

    fireEvent.click(getByTitle('Open file deployment'));

    await waitFor(() => {
      expect(getByRole('dialog')).to.exist;
    });

    expect(deployment.on).to.have.been.calledWith('deployed', sinon.match.func);

    // when
    // simulating <deployed> event as emitted by the deployment
    deployment.on.getCall(0).args[1]({
      deploymentResult: { success: true, response: {} },
      endpoint: { targetType: 'camundaCloud' },
      gatewayVersion: '8.0.0'
    });

    // then
    expect(emit).to.have.been.calledWith('deployment.done', sinon.match.object);
  });


  it('should hand over open overlay when status bar item is replaced', async function() {

    // given
    const subscribe = sinon.spy(function(event, callback) {
      if (event === 'app.activeTabChanged') {
        callback({
          activeTab: DEFAULT_ACTIVE_TAB
        });
      }
    });

    const triggerAction = sinon.spy(function(action) {
      if (action === 'save-tab') {
        return Promise.resolve(true);
      }
    });

    const { getByTitle, queryByRole, rerender } = createDeploymentPlugin({ subscribe, triggerAction });

    fireEvent.click(getByTitle('Open file deployment'));

    await waitFor(() => {
      expect(queryByRole('dialog')).to.exist;
    });

    // when
    rerender({ subscribe, triggerAction, replaced: true });

    // then
    expect(queryByRole('dialog')).not.to.exist;
    expect(triggerAction).to.have.been.calledWith('open-deployment');
  });


  it('should ignore <app.open-deployment> when status bar item is replaced', function() {

    // given
    let openDeployment;

    const subscribe = sinon.spy(function(event, callback) {
      if (event === 'app.activeTabChanged') {
        callback({
          activeTab: DEFAULT_ACTIVE_TAB
        });
      }

      if (event === 'app.open-deployment') {
        openDeployment = callback;
      }
    });

    const triggerAction = sinon.spy();

    createDeploymentPlugin({ subscribe, triggerAction, replaced: true });

    // when
    openDeployment({ tab: DEFAULT_ACTIVE_TAB });

    // then
    expect(triggerAction).not.to.have.been.calledWith('save-tab');
  });

});

const DEFAULT_ACTIVE_TAB = {
  type: 'cloud-bpmn'
};

const DEFAULT_TABS_PROVIDER = {
  getTabIcon: () => {},
  getProvider: () => {}
};

const DEFAULT_GET_FROM_APP = (key) => {
  if (key === 'props') {
    return {
      tabsProvider: DEFAULT_TABS_PROVIDER
    };
  }
};

function createDeploymentPlugin(props = {}) {
  const rendered = render(renderDeploymentPlugin(props));

  return {
    ...rendered,
    rerender: (newProps) => rendered.rerender(renderDeploymentPlugin(newProps))
  };
}

function renderDeploymentPlugin(props) {
  const {
    _getFromApp = DEFAULT_GET_FROM_APP,
    _getGlobal = (name) => {
      if (name === 'deployment') {
        return new Deployment({
          async getConnectionForTab(file) {
            return {
              deployment: {},
              endpoint: DEFAULT_ENDPOINT
            };
          }
        });
      } else if (name === 'zeebeAPI') {
        return new ZeebeAPI();
      }
    },
    displayNotification = () => {},
    log = () => {},
    subscribe = () => {},
    triggerAction = () => {},
    emit = () => {},
    replaced = false
  } = props;

  return <SlotFillRoot>
    <Slot name="status-bar__file" />
    <DeploymentPlugin
      _getFromApp={ _getFromApp }
      _getGlobal={ _getGlobal }
      displayNotification={ displayNotification }
      log={ log }
      subscribe={ subscribe }
      triggerAction={ triggerAction }
      emit={ emit } />
    { replaced && (
      <Fill name="replacement" replaces="deployment" slot="status-bar__file">
        <button title="Replacement" />
      </Fill>
    ) }
  </SlotFillRoot>;
}