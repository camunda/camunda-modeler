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

import ProcessApplicationsDeploymentPlugin from '../ProcessApplicationsDeploymentPlugin';

import { Slot, SlotFillRoot } from '../../../app/slot-fill';

describe('ProcessApplicationsDeploymentPlugin', function() {

  beforeEach(function() {
    document.body.innerHTML = '';
  });

  afterEach(function() {
    document.body.innerHTML = '';
  });


  it('should not render status bar item by default', function() {

    // when
    const wrapper = createProcessApplicationsDeploymentPlugin();

    const statusBarItem = wrapper.find('.btn');

    // then
    expect(statusBarItem.exists()).to.be.false;
  });


  it('should render status bar item when active tab can be deployed and process application exists', async function() {

    // when
    const wrapper = createProcessApplicationsDeploymentPlugin({
      processApplication: DEFAULT_PROCESS_APPLICATION
    });

    // then
    const statusBarItem = wrapper.find('.btn');

    expect(statusBarItem.exists()).to.be.true;
    expect(statusBarItem.prop('title')).to.equal('Open process application deployment');
  });


  it('should render overlay when clicking status bar item', async function() {

    // given
    const triggerAction = sinon.spy(function(action) {
      if (action === 'save-tab') {
        return Promise.resolve(true);
      }
    });

    const wrapper = createProcessApplicationsDeploymentPlugin({
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

    const wrapper = createProcessApplicationsDeploymentPlugin({
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

function createProcessApplicationsDeploymentPlugin(props = {}) {
  const {
    _getGlobal = () => {},
    activeTab = DEFAULT_ACTIVE_TAB,
    displayNotification = () => {},
    log = () => {},
    processApplication = null,
    processApplicationItems = [],
    triggerAction = () => {}
  } = props;

  return mount(<SlotFillRoot>
    <Slot name="status-bar__file" />
    <ProcessApplicationsDeploymentPlugin
      _getGlobal={ _getGlobal }
      activeTab={ activeTab }
      displayNotification={ displayNotification }
      log={ log }
      processApplication={ processApplication }
      processApplicationItems={ processApplicationItems }
      triggerAction={ triggerAction } />
  </SlotFillRoot>);
}