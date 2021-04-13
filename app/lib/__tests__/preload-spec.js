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
    const results = [ window.getAppPreload(), window.getAppPreload() ];

    // then
    expect(results[0]).to.exist;
    expect(results[1]).not.to.exist;
  });


  it('should allow to unsubscribe with <on>', function() {

    // given
    const offSpy = sinon.spy();
    const { api } = createPreload({
      ipcRenderer: {
        off: offSpy
      }
    }).getAppPreload();
    const fn = () => {};

    // when
    const { cancel } = api.on('event', fn);
    cancel();

    // then
    expect(offSpy).to.have.been.calledOnce;
    expect(offSpy.args[0]).to.eql([ 'event', fn ]);
  });


  it('should allow to unsubscribe with <once>', function() {

    // given
    const offSpy = sinon.spy();
    const { api } = createPreload({
      ipcRenderer: {
        off: offSpy
      }
    }).getAppPreload();
    const fn = () => {};

    // when
    const { cancel } = api.once('event', fn);
    cancel();

    // then
    expect(offSpy).to.have.been.calledOnce;
    expect(offSpy.args[0]).to.eql([ 'event', fn ]);
  });


  it('should throw error when an event outside of allowed list is sent', function() {

    // given
    const { api } = createPreload().getAppPreload();

    // when
    const sendDangerousEvent = () => {
      api.send('DANGEROUS_EVENT', {});
    };

    // then
    expect(sendDangerousEvent).to.throw();
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
