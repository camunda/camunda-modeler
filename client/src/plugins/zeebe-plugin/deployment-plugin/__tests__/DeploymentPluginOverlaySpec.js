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

import DeploymentPluginOverlay from '../DeploymentPluginOverlay';

describe('DeploymentPluginOverlay', function() {

  it('should render', function() {

    // when
    const wrapper = createDeploymentPluginOverlay();

    // then
    expect(wrapper.find(DeploymentPluginOverlay).exists()).to.be.true;
  });

});

class Mock {
  constructor(overrides = {}) {
    Object.assign(this, overrides);
  }
}

class MockConnectionChecker extends Mock {
  updateConfig() {}

  startChecking() {}

  stopChecking() {}

  on() {}

  off() {}
}

class MockDeployment extends Mock {
  deploy() {}

  getConfigForFile() {}

  setConfigForFile() {}
}

class MockDeploymentConfigValidator extends Mock {
  validateField() {}

  validateConfig() {}
}

class MockAnchor extends Mock {
  getBoundingClientRect() {
    return {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      width: 0,
      height: 0
    };
  }
}

const DEFAULT_ACTIVE_TAB = {
  type: 'cloud-bpmn'
};

function createDeploymentPluginOverlay(props = {}) {
  const {
    activeTab = DEFAULT_ACTIVE_TAB,
    anchor = new MockAnchor(),
    connectionChecker = new MockConnectionChecker(),
    deployment = new MockDeployment(),
    deploymentConfigValidator = new MockDeploymentConfigValidator(),
    displayNotification = () => {},
    log = () => {},
    onClose = () => {},
    tabIcon: TabIcon = () => null,
    tabName = 'BPMN',
    triggerAction = () => {},
  } = props;

  return mount(
    <DeploymentPluginOverlay
      activeTab={ activeTab }
      anchor={ anchor }
      connectionChecker={ connectionChecker }
      deployment={ deployment }
      deploymentConfigValidator={ deploymentConfigValidator }
      displayNotification={ displayNotification }
      log={ log }
      onClose={ onClose }
      tabIcon={ TabIcon }
      tabName={ tabName }
      triggerAction={ triggerAction } />
  );
}