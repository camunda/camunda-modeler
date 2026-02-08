/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React from 'react';

import { render, waitFor } from '@testing-library/react';

import AppParent from '../AppParent';

import Flags, { DISABLE_PLUGINS, RELAUNCH } from '../../util/Flags';

import {
  Backend,
  Config,
  Deployment,
  Dialog,
  FileSystem,
  KeyboardBindings,
  Log,
  Plugins,
  Settings,
  StartInstance,
  SystemClipboard,
  TabsProvider,
  Workspace,
  ZeebeAPI
} from './mocks';

/* global sinon */
const { spy } = sinon;

describe('<AppParent>', function() {

  describe('keyboard bindings', function() {

    function setup() {
      const bindSpy = spy();
      const setOnActionSpy = spy();
      const unbindSpy = spy();
      const updateSpy = spy();

      const keyboardBindings = {
        bind: bindSpy,
        setOnAction: setOnActionSpy,
        unbind: unbindSpy,
        update: updateSpy
      };

      return {
        bindSpy,
        setOnActionSpy,
        updateSpy,
        unbindSpy,
        ...createAppParent({ keyboardBindings })
      };
    }

    it('should bind', function() {

      // given
      const {
        bindSpy,
        setOnActionSpy
      } = setup();

      // then
      expect(bindSpy).to.have.been.called;
      expect(setOnActionSpy).to.have.been.called;
    });


    it('should update', function() {

      // given
      const {
        instance,
        updateSpy
      } = setup();

      // when
      instance.handleMenuUpdate();

      // then
      expect(updateSpy).to.have.been.called;
    });


    it('should unbind', function() {

      // given
      const {
        unbindSpy,
        unmount
      } = setup();

      // when
      unmount();

      // then
      expect(unbindSpy).to.have.been.called;
    });

  });


  describe('workspace', function() {

    it('should restore', function(done) {

      // given
      const workspace = new Workspace();

      const restoreSpy = spy(workspace, 'restore');
      const saveSpy = spy(workspace, 'save');

      const backend = new Backend({
        async sendReady() {

          let err;

          try {

            // then
            expect(restoreSpy).to.have.been.calledOnce;

            // restoring workspace triggers
            // an (async in prod) workspace update, too
            await waitFor(() => {
              expect(saveSpy).to.have.been.called;
            });
          } catch (e) {
            err = e;
          }

          done(err);
        }
      });

      // when
      createAppParent({
        globals: {
          workspace,
          backend
        }
      });
    });


    it('should migrate properties panel layout to side panel layout', function(done) {

      // given
      const backend = new Backend({
        async sendReady() {
          try {
            await waitFor(() => {
              expect(instance.getApp().state.layout).to.eql({
                propertiesPanel: {
                  groups: {
                    foo: {
                      open: true
                    }
                  }
                },
                sidePanel: {
                  open: true,
                  tab: 'properties',
                  width: 300
                }
              });
            });

            done();
          } catch (error) {
            done(error);
          }
        }
      });

      const workspace = new Workspace({
        restore(defaultConfig) {
          return Promise.resolve({
            ...defaultConfig,
            layout: {
              propertiesPanel: {
                open: true,
                width: 300,
                groups: {
                  foo: {
                    open: true
                  }
                }
              }
            }
          });
        }
      });

      // when
      const { instance } = createAppParent({
        globals: {
          backend,
          workspace
        }
      });
    });


    it('should set log closed by default', function(done) {

      // given
      const backend = new Backend({
        async sendReady() {
          try {
            await waitFor(() => {
              expect(instance.getApp().state.layout).to.eql({
                panel: {
                  open: false,
                  tab: 'log'
                }
              });
            });

            done();
          } catch (error) {
            done(error);
          }
        }
      });

      const workspace = new Workspace({
        restore(defaultConfig) {
          return Promise.resolve({
            ...defaultConfig,
            layout: {
              panel: {
                open: true,
                tab: 'log'
              }
            }
          });
        }
      });

      // when
      const { instance } = createAppParent({
        globals: {
          backend,
          workspace
        }
      });
    });


    it('should return promise on workspace save', async function() {

      // given
      const workspace = new Workspace({
        save: () => Promise.resolve()
      });

      const { instance } = createAppParent({
        globals: {
          workspace
        }
      });

      const config = {
        tabs: []
      };

      // when
      const returnValue = instance.handleWorkspaceChanged(config);

      // then
      expect(returnValue).to.be.instanceOf(Promise);
    });

  });


  describe('focus handling', function() {

    it('should trigger <window-focused> action', function() {

      // given
      const backend = new Backend();

      const {
        instance
      } = createAppParent({ globals: { backend } });

      const app = instance.getApp();
      const actionSpy = spy(app, 'triggerAction');

      // when
      backend.receive('client:window-focused');

      // then
      expect(actionSpy).to.have.been.calledWith('window-focused');
    });

  });


  describe('blur handling', function() {

    it('should trigger <window-blurred> action', function() {

      // given
      const backend = new Backend();

      const {
        instance
      } = createAppParent({ globals: { backend } });

      const app = instance.getApp();
      const actionSpy = spy(app, 'triggerAction');

      // when
      backend.receive('client:window-blurred');

      // then
      expect(actionSpy).to.have.been.calledWith('window-blurred');
    });

  });


  describe('trigger action', function() {

    describe('quit', function() {

      it('should handle quit', async function() {

        // given
        const backend = new Backend();

        const {
          instance
        } = createAppParent({ globals: { backend } });

        const app = instance.getApp();
        app.state.tabs = [ createTab() ];

        const saveTabsStub = spy(app, 'saveBeforeClose');

        const quitAllowedSpy = spy(backend, 'sendQuitAllowed');

        // when
        await instance.triggerAction('quit');

        // then
        expect(saveTabsStub).to.have.been.calledOnce;
        expect(quitAllowedSpy).to.have.been.called;
      });


      it('should handle quit aborted', async function() {

        // given
        const backend = new Backend();

        const {
          instance
        } = createAppParent({ globals: { backend } });

        const app = instance.getApp();
        app.state.tabs = [ createTab() ];

        const saveTabsStub = sinon.stub(app, 'saveBeforeClose').resolves(false);

        const quitAbortedSpy = spy(backend, 'sendQuitAborted');

        // when
        await instance.triggerAction('quit');

        // then
        expect(saveTabsStub).to.have.been.calledOnce;
        expect(quitAbortedSpy).to.have.been.called;
      });


      it('should not close tabs', async function() {

        // given
        const backend = new Backend();

        const {
          instance
        } = createAppParent({ globals: { backend } });

        const app = instance.getApp();
        app.state.tabs = [ createTab() ];

        const closeAllTabsSpy = spy(app, 'triggerAction');

        // when
        await instance.triggerAction('quit');

        // then
        expect(closeAllTabsSpy).not.to.have.been.calledWith('close-tab');
        expect(closeAllTabsSpy).not.to.have.been.calledWith('close-all-tabs');
      });

    });


    it('should handle action errors');

  });


  describe('window resize', function() {

    it('should handle window resize', function() {

      // given
      const backend = new Backend();

      const {
        instance
      } = createAppParent({ globals: { backend } });

      const getAppStub = sinon.stub(instance, 'getApp');

      getAppStub.returns({ triggerAction() {} });

      // when
      window.dispatchEvent(new CustomEvent('resize'));

      // then
      expect(getAppStub).to.have.been.calledOnce;

    });


    it('should properly remove resize listener', function() {

      // given
      const backend = new Backend();

      const {
        instance
      } = createAppParent({ globals: { backend } });

      const getAppStub = sinon.stub(instance, 'getApp');

      getAppStub.returns({ triggerAction() {} });

      instance.componentWillUnmount();

      // when
      window.dispatchEvent(new CustomEvent('resize'));

      // then
      expect(getAppStub).to.have.not.been.called;

    });

  });


  describe('bootstrapping', function() {

    function createFile(name) {
      const path = `${name}.bpmn`;

      return {
        path,
        name: path,
        contents: name
      };
    }

    /**
     * Simulate <AppParent> intialization sequence
     * and return opened files + active one.
     *
     * @param {Object} options.restoreWorkspace
     * @param {Array<File>} options.openFiles
     *
     * @return {Promise<Object>}
     */
    function boostrap(options) {

      const {
        restoreWorkspace,
        openFiles = []
      } = options;

      return new Promise((resolve, reject) => {
        const backend = new Backend({
          sendReady: async () => {
            backend.receive('client:open-files', {}, openFiles);
            backend.receive('client:started');
          }
        });

        const workspace = new Workspace({
          config: restoreWorkspace
        });

        const {
          instance,
        } = createAppParent({
          globals: {
            backend,
            workspace
          },
          onStarted: async () => {

            const app = instance.getApp();

            // Wait for all files to be opened (workspace + CLI files, deduplicated)
            const expectedFileCount = new Set([
              ...restoreWorkspace.files.map(f => f.path),
              ...openFiles.map(f => f.path)
            ]).size;

            // Wait for the expected number of tabs to be opened
            await waitFor(() => {
              expect(app.state.tabs).to.have.length(expectedFileCount);
            });

            const {
              tabs,
              activeTab
            } = app.state;

            resolve({
              activeFile: activeTab.file,
              files: tabs.map(t => t.file)
            });
          }
        });
      });
    }


    it('should batch open files', async function() {

      // given
      const fooFile = createFile('foo');
      const barFile = createFile('bar');
      const blubFile = createFile('blub');

      // when
      //
      // (0) workspace restores with [ blub, bar ], blub active
      // (1) [foo, bar] open via cli
      // (2) ready batch opens all files,
      //     making bar (last opened) the active one
      //
      const {
        files,
        activeFile
      } = await boostrap({
        restoreWorkspace: {
          files: [
            blubFile,
            barFile
          ],
          activeFile: 0
        },
        openFiles: [
          fooFile,
          barFile
        ]
      });

      // then
      expect(files).to.eql([
        blubFile,
        barFile,
        fooFile
      ]);

      expect(activeFile).to.eql(barFile);
    });

  });


  describe('backend errors', function() {

    it('should log backend error', function(done) {

      // given
      const message = 'message from backend';
      const backend = new Backend();

      const {
        instance
      } = createAppParent({ globals: { backend } });

      const app = instance.getApp();
      const actionSpy = spy(app, 'triggerAction');

      // when
      backend.receive('backend:error', {}, message);

      // then
      setTimeout(() => {
        expect(actionSpy).to.be.calledWith('log', {
          message,
          category: 'error'
        });

        done();
      });

    });

  });


  describe('client errors', function() {

    it('should log client errors', async function() {

      // given
      const backend = new Backend();

      const {
        instance
      } = createAppParent({ globals: { backend } });

      const app = instance.getApp();
      const actionSpy = spy(app, 'triggerAction');
      const error = createError();

      // when
      await instance.handleError(error);

      // then
      expect(actionSpy).to.have.been.calledWith('log', {
        message: `${error.message}\n${error.stack}`,
        category: 'error'
      });

    });


    it('should log client errors with string source attached', async function() {

      // given
      const backend = new Backend();

      const {
        instance
      } = createAppParent({ globals: { backend } });

      const app = instance.getApp();
      const actionSpy = spy(app, 'triggerAction');
      const error = createError();
      const source = 'error-source';

      // when
      await instance.handleError(error, source);

      // then
      expect(actionSpy).to.have.been.calledWith('log', {
        message: `[${source}] ${error.message}\n${error.stack}`,
        category: 'error'
      });

    });


    it('should log tab errors with file path attached', async function() {

      // given
      const tab = createTab({
        file: {
          path: '/path'
        }
      });
      const backend = new Backend();

      const {
        instance
      } = createAppParent({ globals: { backend } });

      const app = instance.getApp();
      const actionSpy = spy(app, 'triggerAction');
      const error = createError();

      // when
      await app.handleError(error, tab);

      // then
      expect(actionSpy).to.have.been.calledWith('log', {
        message: `[${tab.file.path}] ${error.message}\n${error.stack}`,
        category: 'error'
      });

    });


    it('should log tab errors with filename attached if path is not present', async function() {

      // given
      const tab = createTab();
      const backend = new Backend();

      const {
        instance
      } = createAppParent({ globals: { backend } });

      const app = instance.getApp();
      const actionSpy = spy(app, 'triggerAction');
      const error = createError();

      // when
      await app.handleError(error, tab);

      // then
      expect(actionSpy).to.have.been.calledWith('log', {
        message: `[${tab.file.name}] ${error.message}\n${error.stack}`,
        category: 'error'
      });

    });


    it('should log tab errors with tab id attached if file is not present', async function() {

      // given
      const tab = createTab({
        file: undefined
      });
      const backend = new Backend();

      const {
        instance
      } = createAppParent({ globals: { backend } });

      const app = instance.getApp();
      const actionSpy = spy(app, 'triggerAction');
      const error = createError();

      // when
      await app.handleError(error, tab);

      // then
      expect(actionSpy).to.have.been.calledWith('log', {
        message: `[${tab.id}] ${error.message}\n${error.stack}`,
        category: 'error'
      });

    });


    it('should log client errors to backend', async function() {

      // given
      const backend = new Backend();
      const logSpy = sinon.spy();
      const log = new Log({ error: logSpy });

      const {
        instance
      } = createAppParent({ globals: { backend, log } });

      const app = instance.getApp();
      const error = createError();

      // when
      await app.handleError(error);

      // then
      expect(logSpy).to.have.been.calledWith(`${error.message}\n${error.stack}`);

    });


    it('should log tab errors to backend with file path attached', async function() {

      // given
      const tab = createTab({
        file: {
          path: '/path'
        }
      });

      const backend = new Backend();
      const logSpy = sinon.spy();
      const log = new Log({ error: logSpy });

      const {
        instance
      } = createAppParent({ globals: { backend, log } });

      const app = instance.getApp();
      const error = createError();

      // when
      await app.handleError(error, tab);

      // then
      expect(logSpy).to.have.been.calledWith(`[${tab.file.path}] ${error.message}\n${error.stack}`);

    });


    it('should log tab errors to backend with filename attached if path is not present', async function() {

      // given
      const tab = createTab();

      const backend = new Backend();
      const logSpy = sinon.spy();
      const log = new Log({ error: logSpy });

      const {
        instance
      } = createAppParent({ globals: { backend, log } });

      const app = instance.getApp();
      const error = createError();

      // when
      await app.handleError(error, tab);

      // then
      expect(logSpy).to.have.been.calledWith(`[${tab.file.name}] ${error.message}\n${error.stack}`);

    });


    it('should log tab errors to backend with tab id attached if file is not present', async function() {

      // given
      const tab = createTab({
        file: undefined
      });

      const backend = new Backend();
      const logSpy = sinon.spy();
      const log = new Log({ error: logSpy });

      const {
        instance
      } = createAppParent({ globals: { backend, log } });

      const app = instance.getApp();
      const error = createError();

      // when
      await app.handleError(error, tab);

      // then
      expect(logSpy).to.have.been.calledWith(`[${tab.id}] ${error.message}\n${error.stack}`);

    });

  });


  describe('client warnings', function() {

    it('should log client warnings', async function() {

      // given
      const backend = new Backend();

      const {
        instance
      } = createAppParent({ globals: { backend } });

      const app = instance.getApp();
      const actionSpy = spy(app, 'triggerAction');
      const warning = {
        message: 'warning'
      };

      // when
      await app.handleWarning(warning);

      // then
      expect(actionSpy).to.have.been.calledWith('log', {
        message: warning.message,
        category: 'warning'
      });

    });


    it('should log client warnings with string source attached', async function() {

      // given
      const backend = new Backend();

      const {
        instance
      } = createAppParent({ globals: { backend } });

      const app = instance.getApp();
      const actionSpy = spy(app, 'triggerAction');
      const warning = {
        message: 'warning'
      };
      const source = 'warning-source';

      // when
      await app.handleWarning(warning, source);

      // then
      expect(actionSpy).to.have.been.calledWith('log', {
        message: `[${source}] ${warning.message}`,
        category: 'warning'
      });

    });


    it('should log tab warnings with file path attached', async function() {

      // given
      const tab = createTab({
        file: {
          path: '/path'
        }
      });
      const backend = new Backend();

      const {
        instance
      } = createAppParent({ globals: { backend } });

      const app = instance.getApp();
      const actionSpy = spy(app, 'triggerAction');
      const warning = {
        message: 'warning'
      };

      // when
      await app.handleWarning(warning, tab);

      // then
      expect(actionSpy).to.have.been.calledWith('log', {
        message: `[${tab.file.path}] ${warning.message}`,
        category: 'warning'
      });

    });


    it('should log tab warnings with filename attached if path is not present', async function() {

      // given
      const tab = createTab();
      const backend = new Backend();

      const {
        instance
      } = createAppParent({ globals: { backend } });

      const app = instance.getApp();
      const actionSpy = spy(app, 'triggerAction');
      const warning = {
        message: 'warning'
      };

      // when
      await app.handleWarning(warning, tab);

      // then
      expect(actionSpy).to.have.been.calledWith('log', {
        message: `[${tab.file.name}] ${warning.message}`,
        category: 'warning'
      });

    });


    it('should log tab warnings with tab id attached if file is not present', async function() {

      // given
      const tab = createTab({
        file: undefined
      });
      const backend = new Backend();

      const {
        instance
      } = createAppParent({ globals: { backend } });

      const app = instance.getApp();
      const actionSpy = spy(app, 'triggerAction');
      const warning = {
        message: 'warning'
      };

      // when
      await app.handleWarning(warning, tab);

      // then
      expect(actionSpy).to.have.been.calledWith('log', {
        message: `[${tab.id}] ${warning.message}`,
        category: 'warning'
      });

    });

  });


  describe('plugins hint', function() {

    beforeEach(function() {
      Flags.reset();
    });


    it('should log plugins hint on error', async function() {

      // given
      Flags.init({
        [ DISABLE_PLUGINS ]: true
      });

      const plugins = new Plugins({
        getAppPlugins: () => [ {} ]
      });

      const { instance } = createAppParent({
        globals: {
          plugins
        }
      });

      // when
      await instance.handleError(new Error('error'));

      // then
      const app = instance.getApp();

      await waitFor(() => {
        expect(app.state.logEntries).to.have.length(3);
      });
      expect(app.state.logEntries[1]).to.eql({ category: 'info', message: 'This error may be the result of a plug-in compatibility issue.' });
      expect(app.state.logEntries[2]).to.eql({ category: 'info', message: 'Disable plug-ins (restarts the app)', action: instance.togglePlugins });
    });


    it('should log plugins hint on relaunch', function() {

      // given
      Flags.init({
        [ DISABLE_PLUGINS ]: true,
        [ RELAUNCH ]: true
      });

      // when
      const { instance } = createAppParent();

      // then
      const app = instance.getApp();

      expect(app.state.logEntries).to.eql([
        { category: 'info', message: 'Plugins are temporarily disabled.' },
        { category: 'info', message: 'Enable plug-ins (restarts the app)', action: instance.togglePlugins }
      ]);
    });


    it('should NOT log plugins hint on relaunch', function() {

      // when
      const { instance } = createAppParent();

      // then
      const app = instance.getApp();

      expect(app.state.logEntries).to.have.length(0);
    });

  });

});


function createAppParent(options = {}) {

  const defaultGlobals = {
    backend: new Backend(),
    config: new Config(),
    deployment: new Deployment(),
    dialog: new Dialog(),
    fileSystem: new FileSystem(),
    log: new Log(),
    plugins: new Plugins(),
    settings: new Settings(),
    startInstance: new StartInstance(),
    systemClipboard: new SystemClipboard(),
    workspace: new Workspace(),
    zeebeAPI: new ZeebeAPI()
  };

  const globals = {
    ...defaultGlobals,
    ...(options.globals || {})
  };

  const keyboardBindings = options.keyboardBindings || new KeyboardBindings();

  const tabsProvider = options.tabsProvider || new TabsProvider();

  const onStarted = options.onStarted;

  const ref = React.createRef();

  const rendered = render(
    <AppParent
      ref={ ref }
      globals={ globals }
      keyboardBindings={ keyboardBindings }
      tabsProvider={ tabsProvider }
      onStarted={ onStarted }
    />
  );

  return {
    ...rendered,
    instance: ref.current,
  };
}

function createTab(overrides = {}) {
  return {
    id: 42,
    name: 'foo.bar',
    type: 'bar',
    title: 'unsaved',
    file: {
      name: 'foo.bar',
      contents: '',
      path: null
    },
    ...overrides
  };
}

function createError() {
  const stackFrames = [
    'at foo (webpack:///foo.js)',
    'at bar (webpack:///bar.js)'
  ];

  return {
    message: 'error',
    stack: stackFrames.join('\n')
  };
}
