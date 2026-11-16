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
  name: 'camunda.json',
  uri: 'file:///C:/camunda-project/camunda.json',
  path: 'C://camunda-project/camunda.json',
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
      expect(writeFile).to.have.been.calledWith('/project/camunda.json', {
        name: 'camunda.json',
        contents: '{}',
        path: null
      });
    });

    expect(send).to.have.been.calledWith('file-context:file-opened', '/project/camunda.json', undefined);
    expect(triggerAction).to.have.been.calledWith('display-notification', sinon.match({
      type: 'success',
      title: 'Project created'
    }));
  });


  describe('create Camunda project with files', function() {

    const FILES = [
      { name: 'diagram.bpmn', contents: '<bpmn />' },
      { name: 'form.form', contents: '{}' }
    ];


    it('should show the given dialog title', async function() {

      // given
      const dialog = { showOpenFilesDialog: sinon.stub().resolves([]) };

      const { emit } = createCamundaProjectsPlugin({ _getGlobal: createGlobals({ dialog }) });

      // when
      act(() => emit('create-camunda-project', { title: 'Create Project from Blueprint', files: FILES }));

      // then
      await waitFor(() => {
        expect(dialog.showOpenFilesDialog).to.have.been.calledWithMatch({ title: 'Create Project from Blueprint' });
      });
    });


    it('should write the project file and the files', async function() {

      // given
      const fileSystem = createFileSystem();

      const { emit } = createCamundaProjectsPlugin({ _getGlobal: createGlobals({ fileSystem }) });

      // when
      act(() => emit('create-camunda-project', { files: FILES }));

      // then
      await waitFor(() => {
        expect(fileSystem.writeFile.args.map(([ path ]) => path)).to.eql([
          '/project/camunda.json',
          '/project/diagram.bpmn',
          '/project/form.form'
        ]);
      });
    });


    it('should open the files, the first one last', async function() {

      // given
      const triggerAction = sinon.spy();

      const { emit } = createCamundaProjectsPlugin({ triggerAction, _getGlobal: createGlobals() });

      // when
      act(() => emit('create-camunda-project', { files: FILES }));

      // then
      await waitFor(() => {
        expect(triggerAction.withArgs('open-diagram').args.map(([ , { path } ]) => path)).to.eql([
          '/project/form.form',
          '/project/diagram.bpmn'
        ]);
      });
    });


    it('should keep an existing project file', async function() {

      // given
      const fileSystem = createFileSystem([ '/project/camunda.json' ]);

      const { emit } = createCamundaProjectsPlugin({ _getGlobal: createGlobals({ fileSystem }) });

      // when
      act(() => emit('create-camunda-project', { files: FILES }));

      // then
      await waitFor(() => expect(fileSystem.writeFile).to.have.been.calledTwice);

      expect(fileSystem.writeFile).not.to.have.been.calledWith('/project/camunda.json');
    });


    it('should NOT overwrite existing files', async function() {

      // given
      const fileSystem = createFileSystem([ '/project/form.form' ]);
      const triggerAction = sinon.spy();

      const { emit } = createCamundaProjectsPlugin({ triggerAction, _getGlobal: createGlobals({ fileSystem }) });

      // when
      act(() => emit('create-camunda-project', { files: FILES }));

      // then
      await waitFor(() => {
        expect(triggerAction).to.have.been.calledWith('display-notification', sinon.match({ type: 'error' }));
      });

      expect(fileSystem.writeFile).not.to.have.been.called;
    });


    it('should NOT create a project with files that cannot be opened', async function() {

      // given
      const fileSystem = createFileSystem();
      const triggerAction = sinon.spy();

      const tabsProvider = { hasProvider: type => type !== 'form' };

      const { emit } = createCamundaProjectsPlugin({
        tabsProvider,
        triggerAction,
        _getGlobal: createGlobals({ fileSystem })
      });

      // when
      act(() => emit('create-camunda-project', { files: FILES }));

      // then
      await waitFor(() => {
        expect(triggerAction).to.have.been.calledWith('display-notification', sinon.match({
          type: 'error',
          title: 'Project not created',
          content: sinon.match('form.form')
        }));
      });

      expect(fileSystem.writeFile).not.to.have.been.called;
    });


    it('should report a failed write', async function() {

      // given
      const fileSystem = createFileSystem();
      const triggerAction = sinon.spy();

      fileSystem.writeFile.onSecondCall().rejects(new Error('disk full'));

      const { emit } = createCamundaProjectsPlugin({ triggerAction, _getGlobal: createGlobals({ fileSystem }) });

      // when
      act(() => emit('create-camunda-project', { files: FILES }));

      // then
      await waitFor(() => {
        expect(triggerAction).to.have.been.calledWith('display-notification', sinon.match({
          type: 'error',
          title: 'Project not created',
          content: sinon.match('disk full')
        }));
      });

      expect(triggerAction).not.to.have.been.calledWith('open-diagram');
    });

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
      // simulate a project being opened for the active tab
      act(() => internalEmit('app.tabsChanged', { tabs: [ CLOUD_TAB ] }));
      act(() => internalEmit('app.activeTabChanged', { activeTab: CLOUD_TAB }));
      act(() => onItemsChanged(null, CAMUNDA_PROJECT_ITEMS));

      const statusBarItem = await waitFor(() => {
        const button = document.querySelector('[title="Open project deployment"]');

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

/**
 * @param {Array<string>} [existingPaths]
 */
function createFileSystem(existingPaths = []) {
  return {
    writeFile: sinon.stub().resolves(),
    readFileStats: sinon.spy(async ({ path }) => ({ path, lastModified: existingPaths.includes(path) ? 1 : 0 }))
  };
}

function createGlobals({
  dialog = { showOpenFilesDialog: sinon.stub().resolves([ '/project' ]) },
  fileSystem = createFileSystem()
} = {}) {
  return (name) => {
    if (name === 'dialog') {
      return dialog;
    } else if (name === 'fileSystem') {
      return fileSystem;
    } else if (name === 'backend') {
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
}

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
      return { tabsProvider: props.tabsProvider || { hasProvider: () => true } };
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
