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

import { render, fireEvent, waitFor } from '@testing-library/react';

import ProcessApplicationsDeploymentPlugin, { canDeployItem } from '../ProcessApplicationsDeploymentPlugin';

import { Slot, SlotFillRoot } from '../../../app/slot-fill';
import { DEFAULT_ENDPOINT } from '../../../app/zeebe/Deployment';

import { Deployment, ZeebeAPI } from '../../../app/__tests__/mocks';

describe('ProcessApplicationsDeploymentPlugin', function() {

  it('should not render status bar item by default', function() {

    // when
    const { container } = createProcessApplicationsDeploymentPlugin();

    const statusBarItem = container.querySelector('.btn');

    // then
    expect(statusBarItem).to.be.null;
  });


  it('should render status bar item when active tab can be deployed and process application exists', async function() {

    // when
    const { container } = createProcessApplicationsDeploymentPlugin({
      processApplication: DEFAULT_PROCESS_APPLICATION
    });

    // then
    const statusBarItem = container.querySelector('.btn');

    expect(statusBarItem).to.not.be.null;
    expect(statusBarItem.getAttribute('title')).to.equal('Open process application deployment');
  });


  it('should render overlay when clicking status bar item', async function() {

    // given
    const triggerAction = sinon.spy(function(action) {
      if (action === 'save-tab') {
        return Promise.resolve(true);
      }
    });

    const { container } = createProcessApplicationsDeploymentPlugin({
      processApplication: DEFAULT_PROCESS_APPLICATION,
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


  it('should render number of deployed files (singular)', async function() {

    // given
    const triggerAction = sinon.spy(function(action) {
      if (action === 'save-tab') {
        return Promise.resolve(true);
      }
    });

    const { container } = createProcessApplicationsDeploymentPlugin({
      processApplication: DEFAULT_PROCESS_APPLICATION,
      processApplicationItems: DEFAULT_ITEMS.filter((item) => [ 'bpmn', 'processApplication' ].includes(item.metadata.type)),
      triggerAction
    });

    // when
    fireEvent.click(container.querySelector('.btn'));

    await waitFor(() => {
      const overlay = document.querySelector('[role="dialog"]');

      expect(overlay).to.exist;
    });

    // then
    const description = document.querySelector('[role="dialog"] .form-description');

    expect(description.textContent).to.include('1 file will be deployed');
  });


  it('should render number of deployed files (plural)', async function() {

    // given
    const triggerAction = sinon.spy(function(action) {
      if (action === 'save-tab') {
        return Promise.resolve(true);
      }
    });

    const { container } = createProcessApplicationsDeploymentPlugin({
      processApplication: DEFAULT_PROCESS_APPLICATION,
      triggerAction
    });

    // when
    fireEvent.click(container.querySelector('.btn'));

    await waitFor(() => {
      const overlay = document.querySelector('[role="dialog"]');

      expect(overlay).to.exist;
    });

    // then
    const description = document.querySelector('[role="dialog"] .form-description');

    expect(description.textContent).to.include('4 files will be deployed');
  });


  it('should not render overlay when clicking status bar item (overlay rendered)', async function() {

    // given
    const triggerAction = sinon.spy(function(action) {
      if (action === 'save-tab') {
        return Promise.resolve(true);
      }
    });

    const { container } = createProcessApplicationsDeploymentPlugin({
      processApplication: DEFAULT_PROCESS_APPLICATION,
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


  describe('#canDeployItem', function() {

    it('should allow supported file types', function() {

      // given
      const items = DEFAULT_ITEMS;

      // when
      const canDeploy = items.map(canDeployItem);

      // then
      expect(canDeploy).to.eql([
        true, // bpmn
        true, // dmn
        true, // form
        true, // rpa
        false, // processApplication
        false // foo
      ]);
    });
  });


  it('should register resources provider', async function() {

    // given
    const registerResourcesProvider = sinon.spy();
    const unregisterResourcesProvider = sinon.spy();

    const getGlobal = (name) => {
      if (name === 'deployment') {
        return new Deployment({
          async getConnectionForTab(file) {
            return DEFAULT_ENDPOINT;
          },
          registerResourcesProvider,
          unregisterResourcesProvider
        });
      } else if (name === 'zeebeAPI') {
        return new ZeebeAPI();
      }
    };

    // when
    const { unmount } = createProcessApplicationsDeploymentPlugin({
      _getGlobal: getGlobal,
      processApplication: DEFAULT_PROCESS_APPLICATION
    });

    // then
    await waitFor(() => {
      expect(registerResourcesProvider).to.have.been.calledOnce;
    });

    // when
    unmount();

    // then
    await waitFor(() => {
      expect(unregisterResourcesProvider).to.have.been.calledOnce;
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

const DEFAULT_ITEMS = [
  {
    file: { path: 'diagram.bpmn' },
    metadata: { type: 'bpmn' }
  },
  {
    file: { path: 'decision.dmn' },
    metadata: { type: 'dmn' }
  },
  {
    file: { path: 'user.form' },
    metadata: { type: 'form' }
  },
  {
    file: { path: 'script.rpa' },
    metadata: { type: 'rpa' }
  },
  {
    file: {
      name: '.process-application',
      uri: 'file:///C:/process-application/.process-application',
      path: 'C://process-application/.process-application',
      dirname: 'C://process-application',
      contents: '{}'
    },
    metadata: {
      type: 'processApplication'
    }
  },
  {
    file: {
      name: 'unknown.file'
    },
    metadata: {
      type: 'foo'
    }
  }
];

function createProcessApplicationsDeploymentPlugin(props = {}) {
  const {
    _getGlobal = (name) => {
      if (name === 'deployment') {
        return new Deployment({
          registerResourcesProvider() {},
          unregisterResourcesProvider() {}
        });
      } else if (name === 'zeebeAPI') {
        return new ZeebeAPI();
      }
    },
    activeTab = DEFAULT_ACTIVE_TAB,
    displayNotification = () => {},
    log = () => {},
    processApplication = null,
    processApplicationItems = DEFAULT_ITEMS,
    triggerAction = () => {}
  } = props;

  return render(<SlotFillRoot>
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