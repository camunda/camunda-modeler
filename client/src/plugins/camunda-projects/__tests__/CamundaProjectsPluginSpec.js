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

import CamundaProjectsPlugin from '../CamundaProjectsPlugin';

import { Slot, SlotFillRoot } from '../../../app/slot-fill';

import { Deployment, ZeebeAPI } from '../../../app/__tests__/mocks';

const CAMUNDA_PROJECT_FILE = {
  name: 'camunda-project.json',
  uri: 'file:///C:/camunda-project/camunda-project.json',
  path: 'C://camunda-project/camunda-project.json',
  dirname: 'C://camunda-project',
  contents: '{}'
};

const DIAGRAM_FILE = {
  name: 'foo.bpmn',
  uri: 'file:///C:/camunda-project/foo.bpmn',
  path: 'C://camunda-project/foo.bpmn',
  dirname: 'C://camunda-project',
  contents: '<?xml version="1.0" encoding="UTF-8"?>'
};

const CAMUNDA_PROJECT_ITEMS = [
  { file: CAMUNDA_PROJECT_FILE, metadata: { type: 'camundaProject' } },
  { file: DIAGRAM_FILE, metadata: { type: 'bpmn' } }
];

const CLOUD_TAB = { id: 'cloud', type: 'cloud-bpmn', file: DIAGRAM_FILE };
const PLATFORM_TAB = { id: 'platform', type: 'bpmn', file: {} };
const EMPTY_TAB = { id: 'empty', type: 'cloud-bpmn', file: null };


describe('<CamundaProjectsPlugin>', function() {

  it('should create Camunda project', async function() {

    // given
    const showOpenFilesDialog = sinon.stub().resolves([ '/project' ]);
    const writeFile = sinon.stub().resolves();
    const send = sinon.spy();
    const triggerAction = sinon.spy();

    const { emit } = createCamundaProjectsPlugin({
      triggerAction,
      _getGlobal: (name) => {
        if (name === 'dialog') {
          return { showOpenFilesDialog };
        } else if (name === 'fileSystem') {
          return { writeFile };
        } else if (name === 'backend') {
          return {
            on() {
              return { cancel() {} };
            },
            send
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
    });

    // when
    act(() => emit('create-camunda-project'));

    // then
    await waitFor(() => {
      expect(writeFile).to.have.been.calledWith('/project/camunda-project.json', {
        name: 'camunda-project.json',
        contents: '{}',
        path: null
      });
    });

    expect(send).to.have.been.calledWith('file-context:file-opened', '/project/camunda-project.json', undefined);
    expect(triggerAction).to.have.been.calledWith('display-notification', sinon.match({
      type: 'success',
      title: 'Camunda project created'
    }));
  });

  describe('resources.reload dispatch', function() {

    it('should reload when the active tab is a cloud-bpmn editor', async function() {

      // given
      const triggerAction = sinon.spy();

      const { emit } = createCamundaProjectsPlugin({ triggerAction });

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

      const { emit } = createCamundaProjectsPlugin({ triggerAction });

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

      const { emit } = createCamundaProjectsPlugin({ triggerAction });

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

      const { emit: internalEmit } = createCamundaProjectsPlugin({
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
      // simulate a Camunda project being opened for the active tab
      act(() => internalEmit('app.tabsChanged', { tabs: [ CLOUD_TAB ] }));
      act(() => internalEmit('app.activeTabChanged', { activeTab: CLOUD_TAB }));
      act(() => onItemsChanged(null, CAMUNDA_PROJECT_ITEMS));

      const statusBarItem = await waitFor(() => {
        const button = document.querySelector('[title="Open Camunda project deployment"]');

        expect(button).to.exist;

        return button;
      });

      fireEvent.click(statusBarItem);

      await waitFor(() => {
        expect(document.querySelector('[role="dialog"]')).to.exist;
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

      // close the Camunda project so module-level state does
      // not leak into subsequent tests
      act(() => internalEmit('app.activeTabChanged', { activeTab: EMPTY_TAB }));
    });

  });
});


// helpers //////////

function createCamundaProjectsPlugin(props = {}) {
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
    <CamundaProjectsPlugin
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
