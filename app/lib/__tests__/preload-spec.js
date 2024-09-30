/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const sinon = require('sinon');
const proxyquire = require('proxyquire');


describe('preload', function() {

  it('should return preload only once', function() {

    // given
    const window = createPreload();

    // when
    const result = window.getAppPreload();
    const secondTry = () => window.getAppPreload();

    // then
    expect(result).to.exist;
    expect(secondTry).to.throw();
  });


  describe('backend#send', function() {

    it('should throw error when an event outside of allowed list is sent', function() {

      // given
      const { backend } = createPreload().getAppPreload();

      // when
      const sendDangerousEvent = () => {
        backend.send('DANGEROUS_EVENT', {});
      };

      // then
      expect(sendDangerousEvent).to.throw();
    });


    it('should resolve if first argument is null', async function() {

      // given
      const { backend } = createPreload({
        ipcRenderer: {
          once(_, cb) {
            cb(null, [ null, 'foo' ]);
          }
        }
      }).getAppPreload();

      // when
      const response = await backend.send('client:ready');

      // then
      expect(response).to.eql('foo');
    });


    it('should reject if first argument is NOT null', async function() {

      // given
      const { backend } = createPreload({
        ipcRenderer: {
          once(_, cb) {
            cb(null, [ new Error('cannot execute') ]);
          }
        }
      }).getAppPreload();

      // when
      const result = await backend.send('client:ready').catch(error => {

        // then
        expect(error.message).to.eql('cannot execute');
      });

      expect(result).to.not.exist;
    });


    it('should handle in preload', async function() {

      // given
      const { backend } = createPreload().getAppPreload();

      // when
      let error;
      try {
        await backend.send('file:get-path', new File([], 'foo'));
      } catch (e) {
        error = e;
      }

      // then
      expect(error).to.not.exist;
    });
  });


  describe('backend#on', function() {

    it('should allow to unsubscribe with <on>', function() {

      // given
      const offSpy = sinon.spy();
      const { backend } = createPreload({
        ipcRenderer: {
          off: offSpy
        }
      }).getAppPreload();
      const fn = () => {};

      // when
      const { cancel } = backend.on('event', fn);
      cancel();

      // then
      expect(offSpy).to.have.been.calledOnce;
      expect(offSpy.args[0]).to.eql([ 'event', fn ]);
    });

  });


  describe('backend#once', function() {

    it('should allow to unsubscribe with <once>', function() {

      // given
      const offSpy = sinon.spy();
      const { backend } = createPreload({
        ipcRenderer: {
          off: offSpy
        }
      }).getAppPreload();
      const fn = () => {};

      // when
      const { cancel } = backend.once('event', fn);
      cancel();

      // then
      expect(offSpy).to.have.been.calledOnce;
      expect(offSpy.args[0]).to.eql([ 'event', fn ]);
    });

  });


  describe('backend#getPlatform', function() {

    afterEach(function() {
      sinon.restore();
    });


    it('should return platform', function() {

      // given
      const stub = sinon.stub(process, 'platform');
      stub.value('windows');

      // when
      const { backend } = createPreload().getAppPreload();

      // then
      expect(backend.getPlatform()).to.eql('windows');
    });

  });


  describe('backend#send*', function() {

    [
      'sendQuitAllowed',
      'sendQuitAborted',
      'sendReady',
      'showContextMenu',
      'sendTogglePlugins',
      'sendMenuUpdate',
      'registerMenu'
    ].forEach(api => {

      it(`should NOT throw for ${api}`, function() {

        // given
        const { backend } = createPreload().getAppPreload();

        // when
        const send = () => backend[api]({});

        // then
        expect(send).not.to.throw();
      });
    });


  });
});

function createPreload(overrides = {}) {
  const window = {};

  const ipcRenderer = mockIpcRenderer(overrides.ipcRenderer);
  const contextBridge = {
    exposeInMainWorld(key, value) {
      window[key] = value;
    }
  };

  proxyquire('../preload.js', {
    electron: {
      contextBridge,
      ipcRenderer
    }
  });

  return window;
}

function mockIpcRenderer(overrides = {}) {
  return {
    send() {},
    sendSync() {},
    on() {},
    once() {},
    off() {},
    ...overrides
  };
}
