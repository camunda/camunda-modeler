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
      return { cancel: () => {} };
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
      return { cancel: () => {} };
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
      return { cancel: () => {} };
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
      return { cancel: () => {} };
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
      return { cancel: () => {} };
    });

    const settings = createMockSettings({
      'connectionManagerPlugin.c8connections': DEFAULT_CONNECTIONS
    });

    const globals = {
      deployment: {
        async getConnectionForTab(tab) {
          return DEFAULT_CONNECTIONS[0];
        }
      }
    };

    // when
    const { getByTitle } = createConnectionManagerPlugin({ subscribe, settings }, globals);

    await waitFor(() => {
      const statusBarItem = getByTitle('Configure Camunda 8 connection');
      expect(statusBarItem).to.exist;
      expect(statusBarItem.textContent).to.contain('Test Connection 1');
    });
  });


  it('should default to "No connection" when connections array is empty', async function() {

    // given
    const config = createMockConfig({});

    const subscribe = sinon.spy(function(event, callback) {
      if (event === 'app.activeTabChanged') {
        callback({
          activeTab: DEFAULT_ACTIVE_TAB
        });
      }
      return { cancel: () => {} };
    });

    const settings = createMockSettings({
      'connectionManagerPlugin.c8connections': []
    });

    // when
    const { getByTitle, getByLabelText } = createConnectionManagerPlugin({ subscribe, settings, config });

    // then
    await waitFor(() => {
      const statusBarItem = getByTitle('Configure Camunda 8 connection');
      expect(statusBarItem.textContent).to.contain('No connection');
      const idleIcon = getByLabelText('Idle');
      expect(idleIcon).to.exist;
    });
  });


  it('should default to "No connection" when connections is null or undefined', async function() {

    // given
    const config = createMockConfig({});

    const subscribe = sinon.spy(function(event, callback) {
      if (event === 'app.activeTabChanged') {
        callback({
          activeTab: DEFAULT_ACTIVE_TAB
        });
      }
      return { cancel: () => {} };
    });

    const settings = createMockSettings({
      'connectionManagerPlugin.c8connections': null
    });

    // when
    const { getByTitle, getByLabelText } = createConnectionManagerPlugin({ subscribe, settings, config });

    // then
    await waitFor(() => {
      const statusBarItem = getByTitle('Configure Camunda 8 connection');
      expect(statusBarItem.textContent).to.contain('No connection');
      const idleIcon = getByLabelText('Idle');
      expect(idleIcon).to.exist;
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
        return { cancel: () => {} };
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
        return { cancel: () => {} };
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
        return { cancel: () => {} };
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


    describe('events', function() {

      let clock;

      beforeEach(function() {

        // excludes requestAnimationFrame used by React
        clock = sinon.useFakeTimers({
          toFake: [ 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval' ]
        });
      });

      afterEach(function() {
        clock.restore();
      });


      it('should emit connectionManager.connectionStatusChanged on connection check result', async function() {

        // given
        const subscribe = (event, callback) => {
          if (event === 'app.activeTabChanged') {

            // required as otherwise the config is set to `null` later
            waitForNextCycle().then(() => callback({
              activeTab: DEFAULT_ACTIVE_TAB
            }));
          }
          return { cancel: () => {} };
        };

        const settings = createMockSettings({
          'connectionManagerPlugin.c8connections': DEFAULT_CONNECTIONS
        });

        const emit = sinon.spy();

        // when
        createConnectionManagerPlugin({
          getConnectionForTab: () => Promise.resolve(DEFAULT_CONNECTIONS[0]),
          subscribe,
          settings,
          emit,
          connectionCheckResult: { success: true }
        });

        // wait for the connection to resolve and the first check to run
        await waitForStatusChanges(clock, emit, 1);

        // then
        expect(emit).to.have.been.calledWith(
          'connectionManager.connectionStatusChanged',
          sinon.match({
            name: 'plugin',
            success: true
          })
        );
      });


      it('should NOT emit event after the checking is paused', async function() {

        // given
        let openSettings;
        const subscribe = (event, callback) => {
          if (event === 'app.activeTabChanged') {

            // required as otherwise the config is set to `null` later
            waitForNextCycle().then(() => callback({
              activeTab: DEFAULT_ACTIVE_TAB
            }));
          } else if (event === 'app.settings-open') {
            openSettings = callback;
          }
          return { cancel: () => {} };
        };

        const settings = createMockSettings({
          'connectionManagerPlugin.c8connections': DEFAULT_CONNECTIONS
        });

        const emit = sinon.spy();
        createConnectionManagerPlugin({
          getConnectionForTab: () => Promise.resolve(DEFAULT_CONNECTIONS[0]),
          subscribe,
          settings,
          emit,
          connectionCheckResult: { success: true }
        });

        // when
        openSettings();

        // make React state settle
        await waitForNextCycle(3);

        // advance past ConnectionChecker SHORT delay (1000ms)
        await clock.tickAsync(2000);

        // then
        expect(emit).not.to.have.been.calledWith(
          'connectionManager.connectionStatusChanged',
          sinon.match.any
        );
      });


      describe('connectionManager.connectionCheckStarted event', function() {

        it('should emit event on connection check start', async function() {

          // given
          const subscribe = (event, callback) => {
            if (event === 'app.activeTabChanged') {

              // required as otherwise the config is set to `null` later
              waitForNextCycle().then(() => callback({
                activeTab: DEFAULT_ACTIVE_TAB
              }));
            }
            return { cancel: () => {} };
          };

          const settings = createMockSettings({
            'connectionManagerPlugin.c8connections': DEFAULT_CONNECTIONS
          });

          const emit = sinon.spy();

          // when
          createConnectionManagerPlugin({
            getConnectionForTab: () => Promise.resolve(DEFAULT_CONNECTIONS[0]),
            subscribe,
            settings,
            emit,
          });

          // wait for the active tab's connection to resolve
          await waitForClock(clock, () => getEmits(emit, 'connectionManager.connectionCheckStarted')
            .some(call => call.args[1].connectionId === DEFAULT_CONNECTIONS[0].id));

          // then
          expect(emit).to.have.been.calledWith(
            'connectionManager.connectionCheckStarted',
            sinon.match({
              connectionId: DEFAULT_CONNECTIONS[0].id,
              connection: DEFAULT_CONNECTIONS[0],
            })
          );
        });


        [ true, false ].forEach((success) => {
          it('should NOT emit event on connection check result', async function() {

            // given
            const subscribe = (event, callback) => {
              if (event === 'app.activeTabChanged') {

                // required as otherwise the config is set to `null` later
                waitForNextCycle().then(() => callback({
                  activeTab: DEFAULT_ACTIVE_TAB
                }));
              }
              return { cancel: () => {} };
            };

            const settings = createMockSettings({
              'connectionManagerPlugin.c8connections': DEFAULT_CONNECTIONS
            });

            const emit = sinon.spy();

            createConnectionManagerPlugin({
              getConnectionForTab: () => Promise.resolve(DEFAULT_CONNECTIONS[0]),
              subscribe,
              settings,
              emit,
              connectionCheckResult: { success }
            });

            // let the connection resolve and the initial check run
            await waitForStatusChanges(clock, emit, 1);

            // isolate: reset history so assertions only cover the next check cycle
            emit.resetHistory();

            // advance to trigger a periodic check (ConnectionChecker LONG interval = 5000ms)
            await clock.tickAsync(5000);

            // then - connectionStatusChanged was NOT re-emitted (result did not change)
            const statusChangedCalls = emit.getCalls().filter(
              call => call.args[0] === 'connectionManager.connectionStatusChanged'
            );
            expect(statusChangedCalls).to.have.lengthOf(0);

            // and connectionCheckStarted was NOT emitted (no state change occurred)
            const checkStartedCalls = emit.getCalls().filter(
              call => call.args[0] === 'connectionManager.connectionCheckStarted'
            );
            expect(checkStartedCalls).to.have.lengthOf(0);
          });
        });


        it('should NOT emit event on connection check cancel', async function() {

          // given
          let openSettings;
          const subscribe = (event, callback) => {
            if (event === 'app.activeTabChanged') {

              // required as otherwise the config is set to `null` later
              waitForNextCycle().then(() => callback({
                activeTab: DEFAULT_ACTIVE_TAB
              }));
            } else if (event === 'app.settings-open') {
              openSettings = callback;
            }
            return { cancel: () => {} };
          };

          const settings = createMockSettings({
            'connectionManagerPlugin.c8connections': DEFAULT_CONNECTIONS
          });

          const emit = sinon.spy();

          createConnectionManagerPlugin({
            getConnectionForTab: () => Promise.resolve(DEFAULT_CONNECTIONS[0]),
            subscribe,
            settings,
            emit,
            connectionCheckResult: { success: true }
          });

          // let the connection resolve and the initial check run
          await waitForStatusChanges(clock, emit, 1);

          // cancel the in-progress check by opening settings (triggers stopChecking)
          openSettings();

          // let React process the paused state change and settle
          await waitForNextCycle(3);
          await clock.tickAsync(1000);

          // isolate: reset history so assertions only cover the post-cancel window
          emit.resetHistory();

          // advance clock past where the cancelled check interval would have fired
          await clock.tickAsync(5000);

          // then - no connectionCheckStarted from the cancelled check
          const checkStartedCalls = emit.getCalls().filter(
            call => call.args[0] === 'connectionManager.connectionCheckStarted'
          );
          expect(checkStartedCalls).to.have.lengthOf(0);
        });

      });


      describe('connectionManager.connectionStatusChanged de-duplication', function() {

        function createGetGlobal(checkConnection, settings, getConnectionForTab = () => Promise.resolve(DEFAULT_CONNECTIONS[0])) {
          return (name) => {
            if (name === 'deployment') {
              return new Deployment({
                getConnectionForTab,
                async setConnectionForFile() {},
                getEndpoints() {
                  return settings.get('connectionManagerPlugin.c8connections') || [];
                }
              });
            } else if (name === 'zeebeAPI') {
              return new ZeebeAPI({ checkConnection });
            }
          };
        }

        function createSubscribe() {
          return (event, callback) => {
            if (event === 'app.activeTabChanged') {
              waitForNextCycle().then(() => callback({
                activeTab: DEFAULT_ACTIVE_TAB
              }));
            }
            return { cancel: () => {} };
          };
        }


        it('should emit only once for repeated identical results', async function() {

          // given
          const settings = createMockSettings({
            'connectionManagerPlugin.c8connections': DEFAULT_CONNECTIONS
          });

          const checkConnection = () => ({ success: true, response: { gatewayVersion: '8.8.0' } });

          const emit = sinon.spy();

          createConnectionManagerPlugin({
            subscribe: createSubscribe(),
            settings,
            emit,
            _getGlobal: createGetGlobal(checkConnection, settings)
          });

          // when - initial check + several periodic checks all return the same result
          await waitForStatusChanges(clock, emit, 1);
          await clock.tickAsync(5000);
          await clock.tickAsync(5000);

          // then - status change is emitted exactly once
          const statusChangedCalls = getStatusChanges(emit);

          expect(statusChangedCalls).to.have.lengthOf(1);
          expect(statusChangedCalls[0].args[1]).to.include({ success: true });
        });


        it('should emit again when the result changes', async function() {

          // given
          const settings = createMockSettings({
            'connectionManagerPlugin.c8connections': DEFAULT_CONNECTIONS
          });

          let currentResult = { success: true, response: { gatewayVersion: '8.8.0' } };
          const checkConnection = () => currentResult;

          const emit = sinon.spy();

          createConnectionManagerPlugin({
            subscribe: createSubscribe(),
            settings,
            emit,
            _getGlobal: createGetGlobal(checkConnection, settings)
          });

          // when - first check succeeds
          await waitForStatusChanges(clock, emit, 1);

          // ...then the connection starts failing
          currentResult = { success: false, reason: 'CONTACT_POINT_UNAVAILABLE' };
          await waitForStatusChanges(clock, emit, 2);

          // then - status change emitted for both the success and the error
          const statusChangedCalls = getStatusChanges(emit);

          expect(statusChangedCalls).to.have.lengthOf(2);
          expect(statusChangedCalls[0].args[1]).to.include({ success: true });
          expect(statusChangedCalls[1].args[1])
            .to.include({ success: false, reason: 'CONTACT_POINT_UNAVAILABLE' });
        });


        it('should not report a connection error while the connection is still being resolved', async function() {

          // given
          const settings = createMockSettings({
            'connectionManagerPlugin.c8connections': DEFAULT_CONNECTIONS
          });

          const checkConnection = () => ({ success: true, response: { gatewayVersion: '8.8.0' } });

          // resolving the active tab's connection takes longer than `DELAYS.SHORT`
          const getConnectionForTab = () => new Promise(
            resolve => setTimeout(() => resolve(DEFAULT_CONNECTIONS[0]), 2000)
          );

          const emit = sinon.spy();

          createConnectionManagerPlugin({
            subscribe: createSubscribe(),
            settings,
            emit,
            _getGlobal: createGetGlobal(checkConnection, settings, getConnectionForTab)
          });

          // when
          await waitForStatusChanges(clock, emit, 1);

          // then - only the actual check result is reported, no `NO_CONFIG` error
          const statusChangedCalls = getStatusChanges(emit);

          expect(statusChangedCalls).to.have.lengthOf(1);
          expect(statusChangedCalls[0].args[1]).to.include({ success: true });
        });

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
        return { cancel: () => {} };
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
        return { cancel: () => {} };
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
        return { cancel: () => {} };
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
        return { cancel: () => {} };
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
        return { cancel: () => {} };
      });

      // when
      const { queryByTitle } = createConnectionManagerPlugin({ subscribe });

      // then
      await waitFor(() => {
        expect(queryByTitle('Configure Camunda 8 connection')).not.to.exist;
      });
    });

  });


  describe('connection checker pause', function() {

    it('should pause global connection checker when settings are opened', async function() {

      // given
      let openSettings;
      const subscribe = sinon.spy(function(event, callback) {
        if (event === 'app.activeTabChanged') {
          callback({
            activeTab: DEFAULT_ACTIVE_TAB
          });
          return { cancel: () => {} };
        } else if (event === 'app.settings-open') {
          openSettings = callback;
          return { cancel: () => {} };
        }
        return { cancel: () => {} };
      });

      const settings = createMockSettings({
        'connectionManagerPlugin.c8connections': DEFAULT_CONNECTIONS
      });

      const connectionCheckResult = { success: true };

      const ConnectionChecker = require('../../deployment-plugin/ConnectionChecker').default;
      const stopCheckingSpy = sinon.spy(ConnectionChecker.prototype, 'stopChecking');

      const { getByTitle } = createConnectionManagerPlugin({
        subscribe,
        settings,
        connectionCheckResult
      });

      await waitFor(() => {
        expect(getByTitle('Configure Camunda 8 connection')).to.exist;
      });

      // when
      openSettings();

      // then
      await waitFor(() => {
        expect(stopCheckingSpy).to.have.been.called;
      });

      stopCheckingSpy.restore();
    });


    it('should resume global connection checker when settings are closed', async function() {

      // given
      let openSettings;
      let closeSettings;
      const subscribe = sinon.spy(function(event, callback) {
        if (event === 'app.activeTabChanged') {
          callback({
            activeTab: DEFAULT_ACTIVE_TAB
          });
          return { cancel: () => {} };
        } else if (event === 'app.settings-open') {
          openSettings = callback;
          return { cancel: () => {} };
        } else if (event === 'settings.closed') {
          closeSettings = callback;
          return { cancel: () => {} };
        }
        return { cancel: () => {} };
      });

      const settings = createMockSettings({
        'connectionManagerPlugin.c8connections': DEFAULT_CONNECTIONS
      });

      const setConnectionCheckResult = sinon.spy();


      createConnectionManagerPlugin({
        subscribe,
        settings,
        setConnectionCheckResult
      });

      await waitFor(() => {
        expect(openSettings).to.exist;
        expect(closeSettings).to.exist;
      });

      openSettings();

      // when
      closeSettings();

      // then -
      await waitFor(() => {
        expect(setConnectionCheckResult).to.have.been.calledWith(null);
      });
    });


    it('should display inactive status when paused', async function() {

      // given
      let openSettings;
      const subscribe = sinon.spy(function(event, callback) {
        if (event === 'app.activeTabChanged') {
          callback({
            activeTab: DEFAULT_ACTIVE_TAB
          });
          return { cancel: () => {} };
        } else if (event === 'app.settings-open') {
          openSettings = callback;
          return { cancel: () => {} };
        }
        return { cancel: () => {} };
      });

      const settings = createMockSettings({
        'connectionManagerPlugin.c8connections': DEFAULT_CONNECTIONS
      });

      const connectionCheckResult = { success: true };


      const { getByTitle, rerender } = createConnectionManagerPlugin({
        subscribe,
        settings,
        connectionCheckResult
      });

      await waitFor(() => {
        const statusBarItem = getByTitle('Configure Camunda 8 connection');
        expect(statusBarItem).to.exist;
      });

      // when
      openSettings();

      const newProps = createPluginProps({ subscribe, settings, connectionCheckResult });
      rerender(
        <SlotFillRoot>
          <Slot name="status-bar__file" />
          <ConnectionManagerPlugin { ...newProps } />
        </SlotFillRoot>
      );

      // then
      await waitFor(() => {
        const statusBarItem = getByTitle('Configure Camunda 8 connection');
        expect(statusBarItem.querySelector('svg').getAttribute('aria-label')).to.equal('Idle');
      });

    });


    it('should stop connection checker when tab is closed', async function() {

      // given
      let activeTabChangedCallback;
      const subscribe = sinon.spy(function(event, callback) {
        if (event === 'app.activeTabChanged') {
          activeTabChangedCallback = callback;
          callback({
            activeTab: DEFAULT_ACTIVE_TAB
          });
          return { cancel: () => {} };
        }
        return { cancel: () => {} };
      });

      const settings = createMockSettings({
        'connectionManagerPlugin.c8connections': DEFAULT_CONNECTIONS
      });

      const connectionCheckResult = { success: true };

      const ConnectionChecker = require('../../deployment-plugin/ConnectionChecker').default;
      const stopCheckingSpy = sinon.spy(ConnectionChecker.prototype, 'stopChecking');

      const { rerender } = createConnectionManagerPlugin({
        subscribe,
        settings,
        connectionCheckResult
      });

      await waitFor(() => {
        expect(activeTabChangedCallback).to.exist;
      });

      stopCheckingSpy.resetHistory();

      // when
      activeTabChangedCallback({
        activeTab: null
      });

      const newProps = createPluginProps({ subscribe, settings, connectionCheckResult });
      rerender(
        <SlotFillRoot>
          <Slot name="status-bar__file" />
          <ConnectionManagerPlugin { ...newProps } />
        </SlotFillRoot>
      );

      // then
      await waitFor(() => {
        expect(stopCheckingSpy).to.have.been.called;
      });

      stopCheckingSpy.restore();
    });


    it('should stop connection checker when switching to camunda7 tab', async function() {

      // given
      let activeTabChangedCallback;
      const subscribe = sinon.spy(function(event, callback) {
        if (event === 'app.activeTabChanged') {
          activeTabChangedCallback = callback;
          callback({
            activeTab: DEFAULT_ACTIVE_TAB
          });
          return { cancel: () => {} };
        }
        return { cancel: () => {} };
      });

      const settings = createMockSettings({
        'connectionManagerPlugin.c8connections': DEFAULT_CONNECTIONS
      });

      const connectionCheckResult = { success: true };

      const ConnectionChecker = require('../../deployment-plugin/ConnectionChecker').default;
      const stopCheckingSpy = sinon.spy(ConnectionChecker.prototype, 'stopChecking');

      const { rerender } = createConnectionManagerPlugin({
        subscribe,
        settings,
        connectionCheckResult
      });

      // Wait for initial setup
      await waitFor(() => {
        expect(activeTabChangedCallback).to.exist;
      });

      stopCheckingSpy.resetHistory();

      // when
      activeTabChangedCallback({
        activeTab: { ...DEFAULT_ACTIVE_TAB, type: 'bpmn' } // bpmn = c7, cloud-bpmn=c8
      });

      const newProps = createPluginProps({ subscribe, settings, connectionCheckResult });
      rerender(
        <SlotFillRoot>
          <Slot name="status-bar__file" />
          <ConnectionManagerPlugin { ...newProps } />
        </SlotFillRoot>
      );

      // then
      await waitFor(() => {
        expect(stopCheckingSpy).to.have.been.called;
      });

      stopCheckingSpy.restore();
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


    it('should open settings with scrollToEntry', async function() {

      // given
      const subscribe = sinon.spy(function(event, callback) {
        if (event === 'app.activeTabChanged') {
          callback({
            activeTab: DEFAULT_ACTIVE_TAB
          });
        }
        return { cancel: () => {} };
      });

      const config = createMockConfig({
        'connection-manager': {
          connectionId: 'connection-2'
        }
      });

      const settings = createMockSettings({
        'connectionManagerPlugin.c8connections': DEFAULT_CONNECTIONS
      });

      const triggerAction = sinon.spy();

      const globals = {
        deployment: {
          async getConnectionForTab(tab) {
            return DEFAULT_CONNECTIONS[1];
          }
        }
      };

      const { getByTitle, getByText } = createConnectionManagerPlugin({ subscribe, settings, triggerAction, config }, globals);

      await waitFor(() => {
        const statusBarItem = getByTitle('Configure Camunda 8 connection');
        expect(statusBarItem.textContent).to.contain('Test Connection 2');
      });

      getByTitle('Configure Camunda 8 connection').click();

      await waitFor(() => {
        expect(getByText('Manage connections')).to.exist;
      });

      // when
      getByText('Manage connections').click();

      // then
      await waitFor(() => {
        expect(triggerAction).to.have.been.calledWith(
          'settings-open',
          sinon.match({
            scrollToEntry: 'connectionManagerPlugin.c8connections[1].name'
          })
        );
      });
    });


    it('should open settings without specific scrollToEntry when no active connection', async function() {

      // given
      const subscribe = sinon.spy(function(event, callback) {
        if (event === 'app.activeTabChanged') {
          callback({
            activeTab: DEFAULT_ACTIVE_TAB
          });
        }
        return { cancel: () => {} };
      });

      const settings = createMockSettings({
        'connectionManagerPlugin.c8connections': []
      });

      const triggerAction = sinon.spy();

      const { getByTitle, getByText } = createConnectionManagerPlugin({ subscribe, settings, triggerAction });

      await waitFor(() => {
        expect(getByTitle('Configure Camunda 8 connection')).to.exist;
      });

      getByTitle('Configure Camunda 8 connection').click();

      await waitFor(() => {
        expect(getByText('Manage connections')).to.exist;
      });

      // when
      getByText('Manage connections').click();

      // then
      await waitFor(() => {
        expect(triggerAction).to.have.been.calledWith(
          'settings-open',
          sinon.match({
            scrollToEntry: 'connectionManagerPlugin'
          })
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
    'targetType': 'selfHosted',
    'authType': 'none',
    'contactPoint': 'http://localhost:8080'
  },
  {
    id: 'connection-2',
    name: 'Test Connection 2',
    'targetType': 'selfHosted',
    'authType': 'none',
    'contactPoint': 'http://localhost:8081'
  },
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
    getConnectionForTab = async file => DEFAULT_ENDPOINT,
    _getFromApp = DEFAULT_GET_FROM_APP,
    _getGlobal = (name) => {
      if (name === 'deployment') {
        return new Deployment({
          getConnectionForTab,

          async setConnectionForFile(file, connectionId) {
            return;
          },

          getEndpoints() {
            return props.settings ? props.settings.get('connectionManagerPlugin.c8connections') || [] : [];
          },
          ...globals.deployment
        });
      } else if (name === 'zeebeAPI') {
        return new ZeebeAPI({ checkConnection: () => connectionCheckResult });
      }
    },
    displayNotification = () => {},
    log = () => {},
    subscribe = () => ({ cancel: () => {} }),
    triggerAction = () => {},
    emit = () => {},
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
    emit,
    settings,
    config,
    getConfig,
    setConfig,
    connectionCheckResult,
    setConnectionCheckResult
  };
}

function getEmits(emit, event) {
  return emit.getCalls().filter(call => call.args[0] === event);
}

function getStatusChanges(emit) {
  return getEmits(emit, 'connectionManager.connectionStatusChanged');
}

/**
 * Advance the fake clock until `condition` holds.
 *
 * Waiting for the actual condition instead of a fixed number of event loop
 * turns keeps these assertions independent of how React schedules the
 * intermediate re-renders, which differs between platforms.
 */
async function waitForClock(clock, condition, timeout = 30000) {
  for (let elapsed = 0; elapsed <= timeout; elapsed += 100) {
    if (condition()) {
      return;
    }

    await clock.tickAsync(100);
  }

  throw new Error('timeout waiting for condition');
}

async function waitForStatusChanges(clock, emit, count) {
  return waitForClock(clock, () => getStatusChanges(emit).length >= count);
}

async function waitForNextCycle(n = 1) {
  while (n-- > 0) {
    await new Promise(resolve => {
      queueMicrotask(resolve);
    });
  }
}
