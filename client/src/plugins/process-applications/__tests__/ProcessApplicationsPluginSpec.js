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

import { act, render, waitFor } from '@testing-library/react';

import ProcessApplicationsPlugin from '../ProcessApplicationsPlugin';

import { Slot, SlotFillRoot } from '../../../app/slot-fill';

import { Deployment, ZeebeAPI } from '../../../app/__tests__/mocks';

const CLOUD_TAB = { id: 'cloud', type: 'cloud-bpmn', file: {} };
const PLATFORM_TAB = { id: 'platform', type: 'bpmn', file: {} };


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
});


// helpers //////////

function createProcessApplicationsPlugin(props = {}) {
  const {
    triggerAction = () => {},
    displayNotification = () => {},
    log = () => {}
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

  const _getGlobal = (name) => {
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
      log={ log }
      subscribe={ subscribe }
      triggerAction={ triggerAction } />
  </SlotFillRoot>);

  return {
    ...result,
    emit
  };
}
