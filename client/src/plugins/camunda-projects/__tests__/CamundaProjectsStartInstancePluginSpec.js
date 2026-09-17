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

import { render, fireEvent, waitFor } from '@testing-library/react';

import CamundaProjectsStartInstancePlugin from '../CamundaProjectsStartInstancePlugin';

import { Slot, SlotFillRoot } from '../../../app/slot-fill';
import { DEFAULT_ENDPOINT } from '../../../app/zeebe/Deployment';

import { Deployment, StartInstance, ZeebeAPI } from '../../../app/__tests__/mocks';

describe('CamundaProjectsStartInstancePlugin', function() {

  it('should not render status bar item by default', function() {

    // when
    const { container } = createCamundaProjectsStartInstancePlugin();

    const statusBarItem = container.querySelector('.btn');

    // then
    expect(statusBarItem).to.be.null;
  });


  it('should render status bar item when active tab can be started and Camunda project exists', async function() {

    // when
    const { container } = createCamundaProjectsStartInstancePlugin({
      camundaProject: DEFAULT_CAMUNDA_PROJECT
    });

    // then
    const statusBarItem = container.querySelector('.btn');

    expect(statusBarItem).to.not.be.null;
    expect(statusBarItem.getAttribute('title')).to.equal('Open Camunda project start instance');
  });


  it('should not render status bar item when active tab cannot be started', async function() {

    // when
    const { container } = createCamundaProjectsStartInstancePlugin({
      activeTab: {
        type: 'cloud-dmn'
      },
      camundaProject: DEFAULT_CAMUNDA_PROJECT
    });

    // then
    const statusBarItem = container.querySelector('.btn');

    expect(statusBarItem).to.be.null;
  });


  it('should render overlay when clicking status bar item', async function() {

    // given
    const triggerAction = sinon.spy(function(action) {
      if (action === 'save-tab') {
        return Promise.resolve(true);
      }
    });

    const { container } = createCamundaProjectsStartInstancePlugin({
      camundaProject: DEFAULT_CAMUNDA_PROJECT,
      triggerAction
    });

    // when
    fireEvent.click(container.querySelector('.btn'));

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

    const { container } = createCamundaProjectsStartInstancePlugin({
      camundaProject: DEFAULT_CAMUNDA_PROJECT,
      triggerAction
    });

    // when
    fireEvent.click(container.querySelector('.btn'));

    // then
    await waitFor(() => {
      const overlay = document.querySelector('[role="dialog"]');

      expect(overlay).to.exist;
    });

    // when
    fireEvent.click(container.querySelector('.btn'));

    await waitFor(() => {
      const overlay = document.querySelector('[role="dialog"]');

      expect(overlay).not.to.exist;
    });
  });


  it('should forward <emit> to overlay (deployment event)', async function() {

    // given
    const triggerAction = sinon.spy(function(action) {
      if (action === 'save-tab') {
        return Promise.resolve(true);
      }
    });

    const deployment = new Deployment({
      async getConnectionForTab() {
        return DEFAULT_ENDPOINT;
      },
      on: sinon.spy()
    });

    const emit = sinon.spy();

    const { container } = createCamundaProjectsStartInstancePlugin({
      _getGlobal: (name) => {
        if (name === 'deployment') {
          return deployment;
        } else if (name === 'startInstance') {
          return new StartInstance({
            async getConnectionForTab() {
              return {};
            }
          });
        } else if (name === 'zeebeAPI') {
          return new ZeebeAPI();
        }
      },
      emit,
      camundaProject: DEFAULT_CAMUNDA_PROJECT,
      triggerAction
    });

    // when
    fireEvent.click(container.querySelector('.btn'));

    await waitFor(() => {
      const overlay = document.querySelector('[role="dialog"]');

      expect(overlay).to.exist;
    });

    expect(deployment.on).to.have.been.calledWith('deployed', sinon.match.func);

    // simulating <deployed> event as emitted by the deployment
    deployment.on.getCalls().find(call => call.args[0] === 'deployed').args[1]({
      deploymentResult: { success: true, response: {} },
      endpoint: { targetType: 'camundaCloud' },
      gatewayVersion: '8.0.0'
    });

    // then
    expect(emit).to.have.been.calledWith('deployment.done', sinon.match.object);
  });

});

const DEFAULT_CAMUNDA_PROJECT = {
  file: {
    path: 'camunda-project.json'
  }
};

const DEFAULT_ACTIVE_TAB = {
  type: 'cloud-bpmn'
};

function createCamundaProjectsStartInstancePlugin(props = {}) {
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
    emit = () => {},
    log = () => {},
    camundaProject = null,
    camundaProjectItems = [],
    triggerAction = () => {}
  } = props;

  return render(<SlotFillRoot>
    <Slot name="status-bar__file" />
    <CamundaProjectsStartInstancePlugin
      _getGlobal={ _getGlobal }
      activeTab={ activeTab }
      displayNotification={ displayNotification }
      emit={ emit }
      log={ log }
      camundaProject={ camundaProject }
      camundaProjectItems={ camundaProjectItems }
      triggerAction={ triggerAction } />
  </SlotFillRoot>);
}