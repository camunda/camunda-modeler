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

import ProcessApplicationsStartInstancePlugin from '../ProcessApplicationsStartInstancePlugin';

import { Slot, SlotFillRoot } from '../../../app/slot-fill';
import { DEFAULT_ENDPOINT } from '../../../app/zeebe/Deployment';

import { Deployment, StartInstance, ZeebeAPI } from '../../../app/__tests__/mocks';

describe('ProcessApplicationsStartInstancePlugin', function() {

  beforeEach(function() {
    document.body.innerHTML = '';
  });

  afterEach(function() {
    document.body.innerHTML = '';
  });


  it('should not render status bar item by default', function() {

    // when
    const wrapper = createProcessApplicationsStartInstancePlugin();

    const statusBarItem = wrapper.find('.btn');

    // then
    expect(statusBarItem.exists()).to.be.false;
  });


  it('should render status bar item when active tab can be started and process application exists', async function() {

    // when
    const wrapper = createProcessApplicationsStartInstancePlugin({
      processApplication: DEFAULT_PROCESS_APPLICATION
    });

    // then
    const statusBarItem = wrapper.find('.btn');

    expect(statusBarItem.exists()).to.be.true;
    expect(statusBarItem.prop('title')).to.equal('Open process application start instance');
  });


  it('should not render status bar item when active tab cannot be started', async function() {

    // when
    const wrapper = createProcessApplicationsStartInstancePlugin({
      activeTab: {
        type: 'cloud-dmn'
      },
      processApplication: DEFAULT_PROCESS_APPLICATION
    });

    // then
    const statusBarItem = wrapper.find('.btn');

    expect(statusBarItem.exists()).to.be.false;
  });


  it('should render overlay when clicking status bar item', async function() {

    // given
    const triggerAction = sinon.spy(function(action) {
      if (action === 'save-tab') {
        return Promise.resolve(true);
      }
    });

    const wrapper = createProcessApplicationsStartInstancePlugin({
      processApplication: DEFAULT_PROCESS_APPLICATION,
      triggerAction
    });

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
    const triggerAction = sinon.spy(function(action) {
      if (action === 'save-tab') {
        return Promise.resolve(true);
      }
    });

    const wrapper = createProcessApplicationsStartInstancePlugin({
      processApplication: DEFAULT_PROCESS_APPLICATION,
      triggerAction
    });

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

const DEFAULT_PROCESS_APPLICATION = {
  file: {
    path: '.process-application'
  }
};

const DEFAULT_ACTIVE_TAB = {
  type: 'cloud-bpmn'
};

function createProcessApplicationsStartInstancePlugin(props = {}) {
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
    log = () => {},
    processApplication = null,
    processApplicationItems = [],
    triggerAction = () => {}
  } = props;

  return mount(<SlotFillRoot>
    <Slot name="status-bar__file" />
    <ProcessApplicationsStartInstancePlugin
      _getGlobal={ _getGlobal }
      activeTab={ activeTab }
      displayNotification={ displayNotification }
      log={ log }
      processApplication={ processApplication }
      processApplicationItems={ processApplicationItems }
      triggerAction={ triggerAction } />
  </SlotFillRoot>);
}