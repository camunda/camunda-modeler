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

import { fireEvent, render, waitFor } from '@testing-library/react';

import DeploymentPlugin from '../DeploymentPlugin';

import { Slot, SlotFillRoot } from '../../../../app/slot-fill';
import { DEFAULT_ENDPOINT } from '../../../../remote/Deployment';

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
  const {
    _getFromApp = DEFAULT_GET_FROM_APP,
    _getGlobal = (name) => {
      if (name === 'deployment') {
        return new Deployment({
          async getConfigForFile(file) {
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
    triggerAction = () => {}
  } = props;

  return render(<SlotFillRoot>
    <Slot name="status-bar__file" />
    <DeploymentPlugin
      _getFromApp={ _getFromApp }
      _getGlobal={ _getGlobal }
      displayNotification={ displayNotification }
      log={ log }
      subscribe={ subscribe }
      triggerAction={ triggerAction } />
  </SlotFillRoot>);
}