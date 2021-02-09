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

import {
  shallow,
  mount
} from 'enzyme';

import AppParent from '../AppParent';

import Flags, { DISABLE_PLUGINS, RELAUNCH } from '../../util/Flags';

import {
  Backend,
  Config,
  Dialog,
  FileSystem,
  KeyboardBindings,
  Log,
  Plugins,
  TabsProvider,
  Workspace,
  ZeebeAPI
} from './mocks';


/* global sinon */
const { spy } = sinon;


describe('<AppParent>', function() {

  describe('keyboard bindings', function() {

    let appParent,
        bindSpy,
        setOnActionSpy,
        tree,
        unbindSpy,
        updateSpy;

    beforeEach(function() {
      bindSpy = spy();
      setOnActionSpy = spy();
      unbindSpy = spy();
      updateSpy = spy();

      const keyboardBindings = {
        bind: bindSpy,
        setOnAction: setOnActionSpy,
        unbind: unbindSpy,
        update: updateSpy
      };

      ({ appParent, tree } = createAppParent({ keyboardBindings }, mount));
    });

    it('should bind', function() {

      // then
      expect(bindSpy).to.have.been.called;
      expect(setOnActionSpy).to.have.been.called;
    });


    it('should update', function() {

      // when
      appParent.handleMenuUpdate();

      // then
      expect(updateSpy).to.have.been.called;
    });


    it('should unbind', function() {

      // when
      tree.unmount();

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
        sendReady() {

          let err;

          try {

            // then
            expect(restoreSpy).to.have.been.calledOnce;

            // restoring workspace triggers
            // an (async in prod) workspace update, too
            expect(saveSpy).to.have.been.called;
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
      }, mount);
    });


    it('should return promise on workspace save', async function() {

      // given
      const workspace = new Workspace({
        save: () => Promise.resolve()
      });

      const { appParent } = createAppParent({
        globals: {
          workspace
        }
      });

      const config = {
        tabs: []
      };

      // when
      const returnValue = appParent.handleWorkspaceChanged(config);

      // then
      expect(returnValue).to.be.instanceOf(Promise);
    });

  });


  describe('focus handling', function() {

    it('should fire check-file-changed action', function() {

      // given
      const backend = new Backend();

      const {
        appParent
      } = createAppParent({ globals: { backend } }, mount);

      const app = appParent.getApp();
      const actionSpy = spy(app, 'triggerAction');

      // when
      backend.receive('client:window-focused');

      // then
      expect(actionSpy).to.have.been.calledWith('check-file-changed');

    });


    it('should fire notify-focus-change action', function() {

      // given
      const backend = new Backend();

      const {
        appParent
      } = createAppParent({ globals: { backend } }, mount);

      const app = appParent.getApp();
      const actionSpy = spy(app, 'triggerAction');

      // when
      backend.receive('client:window-focused');

      // then
      expect(actionSpy).to.have.been.calledWith('notify-focus-change');

    });

  });


  describe('trigger action', function() {

    it('should handle quit', async function() {

      // given
      const backend = new Backend();

      const {
        appParent
      } = createAppParent({ globals: { backend } }, mount);

      const app = appParent.getApp();

      const closeAllTabsSpy = spy(app, 'triggerAction');

      const quitAllowedSpy = spy(backend, 'sendQuitAllowed');

      // when
      await appParent.triggerAction({}, 'quit');

      // then
      expect(closeAllTabsSpy).to.be.calledWith('close-all-tabs');
      expect(quitAllowedSpy).to.have.been.called;
    });


    it('should handle quit aborted', async function() {

      // given
      const backend = new Backend();

      const {
        appParent
      } = createAppParent({ globals: { backend } }, mount);

      const app = appParent.getApp();

      const closeTabsStub = sinon.stub(app, 'closeTabs').resolves([ false ]);

      const quitAbortedSpy = spy(backend, 'sendQuitAborted');

      // when
      await appParent.triggerAction({}, 'quit');

      // then
      expect(closeTabsStub).to.be.calledOnce;
      expect(quitAbortedSpy).to.have.been.called;
    });


    it('should handle action errors');

  });


  describe('window resize', function() {

    it('should handle window resize', function() {

      // given
      const backend = new Backend();

      const {
        appParent
      } = createAppParent({ globals: { backend } });

      const getAppStub = sinon.stub(appParent, 'getApp');

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
        appParent
      } = createAppParent({ globals: { backend } });

      const getAppStub = sinon.stub(appParent, 'getApp');

      getAppStub.returns({ triggerAction() {} });

      appParent.componentWillUnmount();

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
          appParent,
        } = createAppParent({
          globals: {
            backend,
            workspace
          },
          onStarted: () => {

            const app = appParent.getApp();

            const {
              tabs,
              activeTab
            } = app.state;

            resolve({
              activeFile: activeTab.file,
              files: tabs.map(t => t.file)
            });
          }
        }, mount);
      });
    }


    it('should batch open files', async () => {

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
        appParent
      } = createAppParent({ globals: { backend } }, mount);

      const app = appParent.getApp();
      const actionSpy = spy(app, 'triggerAction');

      // when
      backend.receive('backend:error', {}, message);

      // then
      process.nextTick(() => {
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
        appParent
      } = createAppParent({ globals: { backend } }, mount);

      const app = appParent.getApp();
      const actionSpy = spy(app, 'triggerAction');
      const error = createError();

      // when
      await appParent.handleError(error);

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
        appParent
      } = createAppParent({ globals: { backend } }, mount);

      const app = appParent.getApp();
      const actionSpy = spy(app, 'triggerAction');
      const error = createError();
      const source = 'error-source';

      // when
      await appParent.handleError(error, source);

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
        appParent
      } = createAppParent({ globals: { backend } }, mount);

      const app = appParent.getApp();
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
        appParent
      } = createAppParent({ globals: { backend } }, mount);

      const app = appParent.getApp();
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
        appParent
      } = createAppParent({ globals: { backend } }, mount);

      const app = appParent.getApp();
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
        appParent
      } = createAppParent({ globals: { backend, log } }, mount);

      const app = appParent.getApp();
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
        appParent
      } = createAppParent({ globals: { backend, log } }, mount);

      const app = appParent.getApp();
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
        appParent
      } = createAppParent({ globals: { backend, log } }, mount);

      const app = appParent.getApp();
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
        appParent
      } = createAppParent({ globals: { backend, log } }, mount);

      const app = appParent.getApp();
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
        appParent
      } = createAppParent({ globals: { backend } }, mount);

      const app = appParent.getApp();
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
        appParent
      } = createAppParent({ globals: { backend } }, mount);

      const app = appParent.getApp();
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
        appParent
      } = createAppParent({ globals: { backend } }, mount);

      const app = appParent.getApp();
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
        appParent
      } = createAppParent({ globals: { backend } }, mount);

      const app = appParent.getApp();
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
        appParent
      } = createAppParent({ globals: { backend } }, mount);

      const app = appParent.getApp();
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
        getAppPlugins: () => [{}]
      });

      const { appParent } = createAppParent({
        globals: {
          plugins
        }
      }, mount);

      // when
      await appParent.handleError(new Error('error'));

      // then
      const app = appParent.getApp();

      expect(app.state.logEntries).to.have.length(3);
      expect(app.state.logEntries[1]).to.eql({ category: 'info', message: 'This error may be the result of a plug-in compatibility issue.' });
      expect(app.state.logEntries[2]).to.eql({ category: 'info', message: 'Disable plug-ins (restarts the app)', action: appParent.togglePlugins });
    });


    it('should log plugins hint on relaunch', function() {

      // given
      Flags.init({
        [ DISABLE_PLUGINS ]: true,
        [ RELAUNCH ]: true
      });

      // when
      const { appParent } = createAppParent(mount);

      // then
      const app = appParent.getApp();

      expect(app.state.logEntries).to.eql([
        { category: 'info', message: 'Plugins are temporarily disabled.' },
        { category: 'info', message: 'Enable plug-ins (restarts the app)', action: appParent.togglePlugins }
      ]);
    });


    it('should NOT log plugins hint on relaunch', function() {

      // when
      const { appParent } = createAppParent(mount);

      // then
      const app = appParent.getApp();

      expect(app.state.logEntries).to.have.length(0);
    });

  });

});


function createAppParent(options = {}, mountFn=shallow) {

  if (typeof options === 'function') {
    mountFn = options;
    options = {};
  }

  let appParent;

  const defaultGlobals = {
    backend: new Backend(),
    config: new Config(),
    dialog: new Dialog(),
    fileSystem: new FileSystem(),
    log: new Log(),
    plugins: new Plugins(),
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

  const AppParentComponent = mountFn !== shallow ? AppParent : ShallowAppParent;

  const tree = mountFn(
    <AppParentComponent
      globals={ globals }
      keyboardBindings={ keyboardBindings }
      tabsProvider={ tabsProvider }
      onStarted={ onStarted }
    />
  );

  appParent = tree.instance();

  return {
    appParent,
    tree
  };

}

class ShallowAppParent extends AppParent {
  getApp() {
    return {
      triggerAction() {}
    };
  }
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
