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

import { act, fireEvent, render, waitFor } from '@testing-library/react';

import ProcessApplicationsPlugin from '../ProcessApplicationsPlugin';

import { Slot, SlotFillRoot } from '../../../app/slot-fill';

import { Deployment, ZeebeAPI } from '../../../app/__tests__/mocks';

const PROCESS_APPLICATION_FILE = {
  name: '.process-application',
  uri: 'file:///C:/process-application/.process-application',
  path: 'C://process-application/.process-application',
  dirname: 'C://process-application',
  contents: '{}'
};

const DIAGRAM_FILE = {
  name: 'foo.bpmn',
  uri: 'file:///C:/process-application/foo.bpmn',
  path: 'C://process-application/foo.bpmn',
  dirname: 'C://process-application',
  contents: '<?xml version="1.0" encoding="UTF-8"?>'
};

const PROCESS_APPLICATION_ITEMS = [
  { file: PROCESS_APPLICATION_FILE, metadata: { type: 'processApplication' } },
  { file: DIAGRAM_FILE, metadata: { type: 'bpmn' } }
];

const CLOUD_TAB = { id: 'cloud', type: 'cloud-bpmn', file: DIAGRAM_FILE };
const PLATFORM_TAB = { id: 'platform', type: 'bpmn', file: {} };
const EMPTY_TAB = { id: 'empty', type: 'cloud-bpmn', file: null };


describe('<ProcessApplicationsPlugin>', function() {

  describe('resources.reload dispatch', function() {

    it('should reload when the active tab is a cloud-bpmn editor', async function() {

      // given
      const triggerAction = sinon.spy();

      const { emit } = createProcessApplicationsPlugin({ triggerAction });

      // when
      act(() => emit('app.activeTabChanged', { activeTab: CLOUD_TAB }));

      // then
      await waitFor(() => {
        expect(triggerAction).to.have.been.calledWith('resources.reload');
      });
    });


    it('should NOT reload when the active tab is not a cloud-bpmn editor', async function() {

      // given
      const triggerAction = sinon.spy();

      const { emit } = createProcessApplicationsPlugin({ triggerAction });

      // when
      act(() => emit('app.activeTabChanged', { activeTab: PLATFORM_TAB }));

      // then
      await act(async () => {});

      expect(triggerAction).not.to.have.been.calledWith('resources.reload');
    });
  });


  describe('set-tab-groups dispatch', function() {

    it('should dispatch set-tab-groups with the full tab group map', async function() {

      // given
      const triggerAction = sinon.spy();

      const { emit } = createProcessApplicationsPlugin({ triggerAction });

      // when
      act(() => emit('app.tabsChanged', { tabs: [ CLOUD_TAB, PLATFORM_TAB ] }));

      // then
      await waitFor(() => {
        expect(triggerAction).to.have.been.calledWith('set-tab-groups', {
          cloud: null,
          platform: null
        });
      });
    });
  });


  describe('<emit> forwarding to child plugins', function() {

    it('should forward <emit> to deployment overlay (deployment event)', async function() {

      // given
      const triggerAction = sinon.spy(function(action) {
        if (action === 'save-tab') {
          return Promise.resolve(true);
        }
      });

      const deployment = new Deployment({
        async getConnectionForTab() {
          return {};
        },
        on: sinon.spy(),
        registerResourcesProvider() {},
        unregisterResourcesProvider() {}
      });

      const emit = sinon.spy();

      let onItemsChanged;

      const { emit: internalEmit } = createProcessApplicationsPlugin({
        triggerAction,
        emit,
        _getGlobal: (name) => {
          if (name === 'backend') {
            return {
              on(event, callback) {
                if (event === 'file-context:changed') {
                  onItemsChanged = callback;
                }

                return { cancel() {} };
              },
              send() {}
            };
          } else if (name === 'deployment') {
            return deployment;
          } else if (name === 'zeebeAPI') {
            return new ZeebeAPI();
          } else if (name === 'startInstance') {
            return {};
          }
        }
      });

      // when
      // simulate a process application being opened for the active tab
      act(() => internalEmit('app.tabsChanged', { tabs: [ CLOUD_TAB ] }));
      act(() => internalEmit('app.activeTabChanged', { activeTab: CLOUD_TAB }));
      act(() => onItemsChanged(null, PROCESS_APPLICATION_ITEMS));

      const statusBarItem = await waitFor(() => {
        const button = document.querySelector('[title="Open process application deployment"]');

        expect(button).to.exist;

        return button;
      });

      fireEvent.click(statusBarItem);

      await waitFor(() => {
        expect(document.querySelector('[role="dialog"]')).to.exist;
      });

      expect(deployment.on).to.have.been.calledWith('deployed', sinon.match.func);

      // simulating <deployed> event as emitted by the deployment
      deployment.on.getCall(0).args[1]({
        deploymentResult: { success: true, response: {} },
        endpoint: { targetType: 'camundaCloud' },
        gatewayVersion: '8.0.0'
      });

      // then
      expect(emit).to.have.been.calledWith('deployment.done', sinon.match.object);

      // close the process application so module-level state does
      // not leak into subsequent tests
      act(() => internalEmit('app.activeTabChanged', { activeTab: EMPTY_TAB }));
    });

  });
});


// helpers //////////

function createProcessApplicationsPlugin(props = {}) {
  const {
    triggerAction = () => {},
    displayNotification = () => {},
    log = () => {},
    emit: emitProp = () => {},
    _getGlobal = (name) => {
      if (name === 'backend') {
        return {
          on() {
            return { cancel() {} };
          },
          send() {}
        };
      } else if (name === 'deployment') {
        return new Deployment({
          async getConnectionForTab() {
            return {};
          },
          registerResourcesProvider() {},
          unregisterResourcesProvider() {}
        });
      } else if (name === 'zeebeAPI') {
        return new ZeebeAPI();
      } else if (name === 'startInstance') {
        return {};
      }
    }
  } = props;

  const subscribers = {};

  const subscribe = (event, callback) => {
    subscribers[ event ] = subscribers[ event ] || [];
    subscribers[ event ].push(callback);

    return {
      cancel() {
        subscribers[ event ] = subscribers[ event ].filter(cb => cb !== callback);
      }
    };
  };

  const emit = (event, payload) => {
    (subscribers[ event ] || []).forEach(cb => cb(payload));
  };

  const _getFromApp = (prop) => {
    if (prop === 'props') {
      return { tabsProvider: {} };
    }
  };

  const result = render(<SlotFillRoot>
    <Slot name="status-bar__file" />
    <ProcessApplicationsPlugin
      _getFromApp={ _getFromApp }
      _getGlobal={ _getGlobal }
      displayNotification={ displayNotification }
      emit={ emitProp }
      log={ log }
      subscribe={ subscribe }
      triggerAction={ triggerAction } />
  </SlotFillRoot>);

  return {
    ...result,
    emit
  };
}
