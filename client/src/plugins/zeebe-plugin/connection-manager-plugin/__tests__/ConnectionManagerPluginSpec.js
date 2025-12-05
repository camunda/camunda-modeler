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

import { render, waitFor } from '@testing-library/react';

import ConnectionManagerPlugin from '../ConnectionManagerPlugin';

import { Slot, SlotFillRoot } from '../../../../app/slot-fill';
import { DEFAULT_ENDPOINT } from '../../../../app/zeebe/Deployment';

import { Deployment, ZeebeAPI } from '../../../../app/__tests__/mocks';

describe('ConnectionManagerPlugin', function() {
  it('should not render status bar item by default', function() {

    // when
    const { queryByTitle } = createConnectionManagerPlugin();

    const statusBarItem = queryByTitle('Configure Camunda 8 connection');

    // then
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
    const { getByTitle } = createConnectionManagerPlugin({ subscribe });

    // then
    await waitFor(() => {
      const statusBarItem = getByTitle('Configure Camunda 8 connection');
      expect(statusBarItem).to.exist;
      expect(statusBarItem.title).to.equal('Configure Camunda 8 connection');
    });
  });


  it('should open overlay when clicking status bar item', async function() {

    // given
    const subscribe = sinon.spy(function(event, callback) {
      if (event === 'app.activeTabChanged') {
        callback({
          activeTab: DEFAULT_ACTIVE_TAB
        });
      }
    });

    const { getByTitle, queryByText } = createConnectionManagerPlugin({ subscribe });

    await waitFor(() => {
      expect(getByTitle('Configure Camunda 8 connection')).to.exist;
    });

    // when
    getByTitle('Configure Camunda 8 connection').click();

    // then
    await waitFor(() => {
      expect(queryByText('Select Camunda 8 connection')).to.exist;
    });
  });


  it('should close overlay when clicking status bar item again', async function() {

    // given
    const subscribe = sinon.spy(function(event, callback) {
      if (event === 'app.activeTabChanged') {
        callback({
          activeTab: DEFAULT_ACTIVE_TAB
        });
      }
    });

    const { getByTitle, queryByText } = createConnectionManagerPlugin({ subscribe });

    await waitFor(() => {
      expect(getByTitle('Configure Camunda 8 connection')).to.exist;
    });

    // when
    getByTitle('Configure Camunda 8 connection').click();

    // then
    await waitFor(() => {
      expect(queryByText('Select Camunda 8 connection')).to.exist;
    });

    // when
    getByTitle('Configure Camunda 8 connection').click();

    // then
    await waitFor(() => {
      expect(queryByText('Select Camunda 8 connection')).not.to.exist;
    });
  });


  it('should close overlay on tab change', async function() {

    // given
    let activeTabChangedCallback;
    const subscribe = sinon.spy(function(event, callback) {
      if (event === 'app.activeTabChanged') {
        activeTabChangedCallback = callback;
        callback({
          activeTab: DEFAULT_ACTIVE_TAB
        });
      }
    });

    const { getByTitle, queryByText, rerender } = createConnectionManagerPlugin({ subscribe });

    await waitFor(() => {
      expect(getByTitle('Configure Camunda 8 connection')).to.exist;
    });

    // when
    getByTitle('Configure Camunda 8 connection').click();

    // then
    await waitFor(() => {
      expect(queryByText('Select Camunda 8 connection')).to.exist;
    });

    // when
    activeTabChangedCallback({
      activeTab: { ...DEFAULT_ACTIVE_TAB, id: 'different-tab' }
    });

    // Need to rerender to see the effect
    const newProps = createPluginProps({ subscribe });
    rerender(
      <SlotFillRoot>
        <Slot name="status-bar__file" />
        <ConnectionManagerPlugin { ...newProps } />
      </SlotFillRoot>
    );

    // then
    await waitFor(() => {
      expect(queryByText('Select Camunda 8 connection')).to.not.exist;
    });
  });


  it('should display active connection name in status bar', async function() {

    // given
    const subscribe = sinon.spy(function(event, callback) {
      if (event === 'app.activeTabChanged') {
        callback({
          activeTab: DEFAULT_ACTIVE_TAB
        });
      }
    });

    const settings = createMockSettings({
      'connectionManagerPlugin.c8connections': DEFAULT_CONNECTIONS
    });

    // when
    const { getByTitle } = createConnectionManagerPlugin({ subscribe, settings });

    await waitFor(() => {
      const statusBarItem = getByTitle('Configure Camunda 8 connection');
      expect(statusBarItem).to.exist;
      expect(statusBarItem.textContent).to.contain('Test Connection 1');
    });
  });


  it('should load connection from config for active tab', async function() {

    // given
    const connectionId = 'connection-2';
    const config = createMockConfig({
      'connection-manager': { connectionId }
    });

    const subscribe = sinon.spy(function(event, callback) {
      if (event === 'app.activeTabChanged') {
        callback({
          activeTab: DEFAULT_ACTIVE_TAB
        });
      }
    });

    const settings = createMockSettings({
      'connectionManagerPlugin.c8connections': DEFAULT_CONNECTIONS
    });

    // when
    const { getByTitle } = createConnectionManagerPlugin({ subscribe, settings, config });

    await waitFor(() => {
      const statusBarItem = getByTitle('Configure Camunda 8 connection');
      expect(statusBarItem.textContent).to.contain('Test Connection 2');
    });
  });


  it('should use first connection as default when no config exists', async function() {

    // given
    const config = createMockConfig({});

    const subscribe = sinon.spy(function(event, callback) {
      if (event === 'app.activeTabChanged') {
        callback({
          activeTab: DEFAULT_ACTIVE_TAB
        });
      }
    });

    const settings = createMockSettings({
      'connectionManagerPlugin.c8connections': DEFAULT_CONNECTIONS
    });

    // when
    const { getByTitle } = createConnectionManagerPlugin({ subscribe, settings, config });

    await waitFor(() => {
      const statusBarItem = getByTitle('Configure Camunda 8 connection');
      expect(statusBarItem.textContent).to.contain('Test Connection 1');
    });
  });


  describe('connection checking', function() {

    it('should display connection check status (success)', async function() {

      // given
      const subscribe = sinon.spy(function(event, callback) {
        if (event === 'app.activeTabChanged') {
          callback({
            activeTab: DEFAULT_ACTIVE_TAB
          });
        }
      });

      const settings = createMockSettings({
        'connectionManagerPlugin.c8connections': DEFAULT_CONNECTIONS
      });

      const connectionCheckResult = { success: true };

      // when
      const { getByTitle } = createConnectionManagerPlugin({
        subscribe,
        settings,
        connectionCheckResult
      });

      // then
      await waitFor(() => {
        const statusBarItem = getByTitle('Configure Camunda 8 connection');
        expect(statusBarItem).to.exist;
        expect(statusBarItem.querySelector('svg')).to.exist;
      });
    });


    it('should display connection check status (error)', async function() {

      // given
      const subscribe = sinon.spy(function(event, callback) {
        if (event === 'app.activeTabChanged') {
          callback({
            activeTab: DEFAULT_ACTIVE_TAB
          });
        }
      });

      const settings = createMockSettings({
        'connectionManagerPlugin.c8connections': DEFAULT_CONNECTIONS
      });

      const connectionCheckResult = { success: false, reason: 'CONTACT_POINT_UNAVAILABLE' };

      // when
      const { getByTitle } = createConnectionManagerPlugin({
        subscribe,
        settings,
        connectionCheckResult
      });

      // then
      await waitFor(() => {
        const statusBarItem = getByTitle('Configure Camunda 8 connection');
        expect(statusBarItem).to.exist;
        expect(statusBarItem.querySelector('svg')).to.exist;
      });
    });


    it('should display connection check status (checking)', async function() {

      // given
      const subscribe = sinon.spy(function(event, callback) {
        if (event === 'app.activeTabChanged') {
          callback({
            activeTab: DEFAULT_ACTIVE_TAB
          });
        }
      });

      const settings = createMockSettings({
        'connectionManagerPlugin.c8connections': DEFAULT_CONNECTIONS
      });

      // when
      const { getByTitle } = createConnectionManagerPlugin({
        subscribe,
        settings,
        connectionCheckResult: null
      });

      // then
      await waitFor(() => {
        const statusBarItem = getByTitle('Configure Camunda 8 connection');
        expect(statusBarItem).to.exist;
        expect(statusBarItem.querySelector('svg')).to.exist;
      });
    });

  });


  describe('tab types', function() {

    it('should render for cloud-bpmn tab', async function() {

      // given
      const subscribe = sinon.spy(function(event, callback) {
        if (event === 'app.activeTabChanged') {
          callback({
            activeTab: { ...DEFAULT_ACTIVE_TAB, type: 'cloud-bpmn' }
          });
        }
      });

      // when
      const { getByTitle } = createConnectionManagerPlugin({ subscribe });

      // then
      await waitFor(() => {
        expect(getByTitle('Configure Camunda 8 connection')).to.exist;
      });
    });


    it('should render for cloud-dmn tab', async function() {

      // given
      const subscribe = sinon.spy(function(event, callback) {
        if (event === 'app.activeTabChanged') {
          callback({
            activeTab: { ...DEFAULT_ACTIVE_TAB, type: 'cloud-dmn' }
          });
        }
      });

      // when
      const { getByTitle } = createConnectionManagerPlugin({ subscribe });

      // then
      await waitFor(() => {
        expect(getByTitle('Configure Camunda 8 connection')).to.exist;
      });
    });


    it('should render for cloud-form tab', async function() {

      // given
      const subscribe = sinon.spy(function(event, callback) {
        if (event === 'app.activeTabChanged') {
          callback({
            activeTab: { ...DEFAULT_ACTIVE_TAB, type: 'cloud-form' }
          });
        }
      });

      // when
      const { getByTitle } = createConnectionManagerPlugin({ subscribe });

      // then
      await waitFor(() => {
        expect(getByTitle('Configure Camunda 8 connection')).to.exist;
      });
    });


    it('should render for rpa tab', async function() {

      // given
      const subscribe = sinon.spy(function(event, callback) {
        if (event === 'app.activeTabChanged') {
          callback({
            activeTab: { ...DEFAULT_ACTIVE_TAB, type: 'rpa' }
          });
        }
      });

      // when
      const { getByTitle } = createConnectionManagerPlugin({ subscribe });

      // then
      await waitFor(() => {
        expect(getByTitle('Configure Camunda 8 connection')).to.exist;
      });
    });


    it('should not render for bpmn tab', async function() {

      // given
      const subscribe = sinon.spy(function(event, callback) {
        if (event === 'app.activeTabChanged') {
          callback({
            activeTab: { ...DEFAULT_ACTIVE_TAB, type: 'bpmn' }
          });
        }
      });

      // when
      const { queryByTitle } = createConnectionManagerPlugin({ subscribe });

      // then
      await waitFor(() => {
        expect(queryByTitle('Configure Camunda 8 connection')).not.to.exist;
      });
    });

  });


  describe('settings integration', function() {

    it('should initialize settings on mount', async function() {

      // given
      const settings = createMockSettings({
        'connectionManagerPlugin.c8connections': DEFAULT_CONNECTIONS
      });

      // when
      createConnectionManagerPlugin({ settings });

      // then
      await waitFor(() => {
        expect(settings.register).to.have.been.called;
      });
    });


    it('should subscribe to connection changes', async function() {

      // given
      const settings = createMockSettings({
        'connectionManagerPlugin.c8connections': DEFAULT_CONNECTIONS
      });

      // when
      createConnectionManagerPlugin({ settings });

      // then
      await waitFor(() => {
        expect(settings.subscribe).to.have.been.calledWith(
          'connectionManagerPlugin.c8connections',
          sinon.match.func
        );
      });
    });
  });

});

const DEFAULT_ACTIVE_TAB = {
  type: 'cloud-bpmn',
  file: {
    path: '/test/file.bpmn'
  }
};

const DEFAULT_CONNECTIONS = [
  {
    id: 'connection-1',
    name: 'Test Connection 1',
    url: 'http://localhost:8080'
  },
  {
    id: 'connection-2',
    name: 'Test Connection 2',
    url: 'http://localhost:8081'
  }
];

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

function createMockSettings(initialValues = {}) {
  const subscribers = {};
  const values = {
    'connectionManagerPlugin.c8connections': [],
    ...initialValues
  };

  return {
    get: sinon.spy((key) => values[key] || []),
    set: sinon.spy((key, value) => {
      values[key] = value;
      if (subscribers[key]) {
        subscribers[key].forEach(cb => cb({ value }));
      }
    }),
    subscribe: sinon.spy((key, callback) => {
      if (!subscribers[key]) {
        subscribers[key] = [];
      }
      subscribers[key].push(callback);
    }),
    register: sinon.spy(() => Promise.resolve())
  };
}

function createMockConfig(initialValues = {}) {
  const values = { ...initialValues };

  return {
    get: sinon.spy((key) => { return values[key]; }),
    getForFile: sinon.spy((file, key) => {
      return Promise.resolve(values[key] || {});
    }),
    setForFile: sinon.spy((file, key, value) => {
      values[key] = value;
      return Promise.resolve();
    })
  };
}

function createConnectionManagerPlugin(props = {}, globals = {}) {
  const pluginProps = createPluginProps(props, globals);

  return render(<SlotFillRoot>
    <Slot name="status-bar__file" />
    <ConnectionManagerPlugin { ...pluginProps } />
  </SlotFillRoot>);
}

function createPluginProps(props = {}, globals = {}) {
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
          },

          async setConnectionForFile(file, connectionId) {
            return;
          },
          ...globals.deployment
        });
      } else if (name === 'zeebeAPI') {
        return new ZeebeAPI();
      }
    },
    displayNotification = () => {},
    log = () => {},
    subscribe = () => {},
    triggerAction = () => {},
    settings = createMockSettings(),
    config = createMockConfig(),
    getConfig = () => config,
    setConfig = () => {},
    connectionCheckResult = null,
    setConnectionCheckResult = () => {}
  } = props;

  return {
    _getFromApp,
    _getGlobal,
    displayNotification,
    log,
    subscribe,
    triggerAction,
    settings,
    config,
    getConfig,
    setConfig,
    connectionCheckResult,
    setConnectionCheckResult
  };
}
