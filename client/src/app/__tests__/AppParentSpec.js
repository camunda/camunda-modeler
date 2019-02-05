import React from 'react';

import {
  shallow,
  mount
} from 'enzyme';

import AppParent from '../AppParent';

import {
  Backend,
  Dialog,
  FileSystem,
  KeyboardBindings,
  TabsProvider,
  Workspace
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

});


function createAppParent(options = {}, mountFn=shallow) {

  if (typeof options === 'function') {
    mountFn = options;
    options = {};
  }

  let appParent;

  const defaultGlobals = {
    backend: new Backend(),
    dialog: new Dialog(),
    fileSystem: new FileSystem(),
    workspace: new Workspace()
  };

  const globals = {
    ...defaultGlobals,
    ...(options.globals || {})
  };

  const keyboardBindings = options.keyboardBindings || new KeyboardBindings();

  const tabsProvider = options.tabsProvider || new TabsProvider();

  const onStarted = options.onStarted;

  const tree = mountFn(
    <AppParent
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