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
            expect(saveSpy).not.to.have.been.called;
          } catch (e) {
            err = e;
          }

          done(err);
        }
      });

      // when
      createAppParent({ globals: { workspace, backend } }, mount);
    });

  });


  describe('on focus', function() {

    it('should fire check-file-changed action', function() {

      // given
      const backend = new Backend();

      const {
        appParent
      } = createAppParent({ globals: { backend } }, mount);

      const app = appParent.appRef.current;
      const actionSpy = spy(app, 'triggerAction');

      // when
      backend.send('client:window-focused');

      // then
      expect(actionSpy).to.have.been.calledWith('check-file-changed');

    });

  });


  describe('trigger action', function() {

    it('should trigger quit', async function() {

      // given
      const backend = new Backend();

      const {
        appParent
      } = createAppParent({ globals: { backend } }, mount);

      const quitAllowedSpy = spy(backend, 'sendQuitAllowed');

      await appParent.triggerAction({}, 'quit');

      // then
      expect(quitAllowedSpy).to.have.been.called;
    });


    it('should handle action errors');

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

  const tree = mountFn(
    <AppParent
      globals={ globals }
      keyboardBindings={ keyboardBindings }
      tabsProvider={ tabsProvider }
    />
  );

  appParent = tree.instance();

  return {
    appParent,
    tree
  };

}