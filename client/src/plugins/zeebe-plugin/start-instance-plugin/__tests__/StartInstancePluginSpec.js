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

import { waitFor } from '@testing-library/react';

import { mount } from 'enzyme';

import StartInstancePlugin from '../StartInstancePlugin';

import { Slot, SlotFillRoot } from '../../../../app/slot-fill';
import { DEFAULT_ENDPOINT } from '../../../../remote/Deployment';

import { Deployment, StartInstance, ZeebeAPI } from '../../../../app/__tests__/mocks';

describe('StartInstancePlugin', function() {

  beforeEach(function() {
    document.body.innerHTML = '';
  });

  afterEach(function() {
    document.body.innerHTML = '';
  });


  it('should not render status bar item by default', function() {

    // when
    const wrapper = createStartInstancePlugin();

    const statusBarItem = wrapper.find('.btn');

    // then
    expect(statusBarItem.exists()).to.be.false;
  });


  it('should render status bar item when active tab can be started', async function() {

    // given
    const subscribe = sinon.spy(function(event, callback) {
      if (event === 'app.activeTabChanged') {
        callback({
          activeTab: DEFAULT_ACTIVE_TAB
        });
      }
    });

    // when
    const wrapper = createStartInstancePlugin({ subscribe });

    // then
    const statusBarItem = wrapper.find('.btn');

    expect(statusBarItem.exists()).to.be.true;
    expect(statusBarItem.prop('title')).to.equal('Open start instance');
  });


  it('should not render status bar item when active tab cannot be started', async function() {

    // given
    const subscribe = sinon.spy(function(event, callback) {
      if (event === 'app.activeTabChanged') {
        callback({
          activeTab: {
            type: 'cloud-dmn'
          }
        });
      }
    });

    // when
    const wrapper = createStartInstancePlugin({ subscribe });

    // then
    const statusBarItem = wrapper.find('.btn');

    expect(statusBarItem.exists()).to.be.false;
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

    const wrapper = createStartInstancePlugin({ subscribe, triggerAction });

    // when
    wrapper.find('.btn').simulate('click');

    // then
    await waitFor(() => {
      const overlay = document.querySelector('[role="dialog"]');

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

    const wrapper = createStartInstancePlugin({ subscribe, triggerAction });

    // when
    wrapper.find('.btn').simulate('click');

    // then
    await waitFor(() => {
      const overlay = document.querySelector('[role="dialog"]');

      expect(overlay).to.exist;
    });

    // when
    wrapper.find('.btn').simulate('click');

    await waitFor(() => {
      const overlay = document.querySelector('[role="dialog"]');

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

function createStartInstancePlugin(props = {}) {
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
      } else if (name === 'startInstance') {
        return new StartInstance({
          async getConfigForFile(file) {
            return {};
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

  return mount(<SlotFillRoot>
    <Slot name="status-bar__file" />
    <StartInstancePlugin
      _getFromApp={ _getFromApp }
      _getGlobal={ _getGlobal }
      displayNotification={ displayNotification }
      log={ log }
      subscribe={ subscribe }
      triggerAction={ triggerAction } />
  </SlotFillRoot>);
}