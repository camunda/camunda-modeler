/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

'use strict';

const proxyquire = require('proxyquire').noCallThru();
const sinon = require('sinon');

const { ENVELOPE } = require('./contract');


/**
 * Characterizes the wire ENVELOPE implemented by `app/lib/util/renderer.js`.
 *
 * A parity (Rust/Tauri) backend MUST reproduce these exact semantics, since the
 * renderer's preload `send` depends on them: the `${event}:response:${id}`
 * channel name, the single `[err, ...results]` array payload, and the
 * Error -> { message, code, ...enumerable } serialization.
 */
describe('ipc-contract - renderer.js wire protocol', function() {

  function loadRenderer() {
    const listeners = new Map();

    const ipcMain = {
      on(event, cb) {
        listeners.set(event, cb);
      }
    };

    const app = { mainWindow: null };

    const renderer = proxyquire('../../util/renderer', {
      electron: { ipcMain, app }
    });

    /**
     * Simulate the renderer dispatching a request-response message.
     */
    function emit(event, id, args) {
      const send = sinon.spy();
      const evt = { sender: { send } };

      listeners.get(event)(evt, id, args);

      return send;
    }

    /**
     * Simulate a sendSync message.
     */
    function emitSync(event, args) {
      const evt = {};

      listeners.get(event)(evt, ...args);

      return evt.returnValue;
    }

    return { renderer, emit, emitSync, listeners };
  }


  describe('on() - request/response', function() {

    it('should reply on the ${event}:response:${id} channel', function() {

      // given
      const { renderer, emit } = loadRenderer();

      renderer.on('file:read', (filePath, done) => done(null, 'CONTENTS'));

      // when
      const send = emit('file:read', 'ID-1', [ '/path' ]);

      // then
      expect(send).to.have.been.calledOnce;
      expect(send.args[0][0]).to.equal('file:read:response:ID-1');
    });


    it('should send a single [err, result] array payload', function() {

      // given
      const { renderer, emit } = loadRenderer();

      renderer.on('file:read', (filePath, done) => done(null, 'CONTENTS'));

      // when
      const send = emit('file:read', 'ID-1', [ '/path' ]);

      // then
      const payload = send.args[0][1];

      expect(payload).to.be.an('array');
      expect(payload).to.eql([ null, 'CONTENTS' ]);
    });


    it('should pass the request args through to the handler before done', function() {

      // given
      const { renderer, emit } = loadRenderer();

      const handler = sinon.spy((a, b, done) => done(null));

      renderer.on('some:event', handler);

      // when
      emit('some:event', 'ID-1', [ 'A', 'B' ]);

      // then
      expect(handler).to.have.been.calledOnce;
      expect(handler.args[0][0]).to.equal('A');
      expect(handler.args[0][1]).to.equal('B');
      expect(handler.args[0][2]).to.be.a('function');
    });


    it('should correlate concurrent calls by id', function() {

      // given
      const { renderer, emit } = loadRenderer();

      const pending = [];

      renderer.on('slow', (value, done) => pending.push(() => done(null, value)));

      // when
      const sendA = emit('slow', 'ID-A', [ 'A' ]);
      const sendB = emit('slow', 'ID-B', [ 'B' ]);

      // resolve out of order
      pending[1]();
      pending[0]();

      // then
      expect(sendB.args[0][0]).to.equal('slow:response:ID-B');
      expect(sendB.args[0][1]).to.eql([ null, 'B' ]);

      expect(sendA.args[0][0]).to.equal('slow:response:ID-A');
      expect(sendA.args[0][1]).to.eql([ null, 'A' ]);
    });


    it('should keep err === null on success (contract: successRequiresNullError)', function() {

      // given
      expect(ENVELOPE.successRequiresNullError).to.be.true;

      const { renderer, emit } = loadRenderer();

      renderer.on('ok', (done) => done(null, 'value'));

      // when
      const send = emit('ok', 'ID-1', []);

      // then - first element is strictly null, not undefined
      expect(send.args[0][1][0]).to.equal(null);
    });

  });


  describe('on() - error serialization', function() {

    it('should expose message and code as enumerable props', function() {

      // given
      const { renderer, emit } = loadRenderer();

      const error = new Error('boom');
      error.code = 'E_BOOM';

      renderer.on('fail', (done) => done(error));

      // when
      const send = emit('fail', 'ID-1', []);

      // then
      const serialized = send.args[0][1][0];

      expect(serialized.message).to.equal('boom');
      expect(serialized.code).to.equal('E_BOOM');
    });


    it('should carry extra enumerable props on the error', function() {

      // given
      const { renderer, emit } = loadRenderer();

      const error = new Error('boom');
      error.details = { reason: 'UNAUTHORIZED' };

      renderer.on('fail', (done) => done(error));

      // when
      const send = emit('fail', 'ID-1', []);

      // then
      expect(send.args[0][1][0].details).to.eql({ reason: 'UNAUTHORIZED' });
    });


    it('should pass non-Error rejection values through unchanged', function() {

      // given
      expect(ENVELOPE.errorSerialization.nonErrorPassThrough).to.be.true;

      const { renderer, emit } = loadRenderer();

      renderer.on('fail', (done) => done({ custom: 'reason' }));

      // when
      const send = emit('fail', 'ID-1', []);

      // then
      expect(send.args[0][1][0]).to.eql({ custom: 'reason' });
    });

  });


  describe('onSync()', function() {

    it('should set event.returnValue synchronously', function() {

      // given
      const { renderer, emitSync } = loadRenderer();

      renderer.onSync('app:get-metadata', () => ({ name: 'Camunda Modeler' }));

      // when
      const returnValue = emitSync('app:get-metadata', []);

      // then
      expect(returnValue).to.eql({ name: 'Camunda Modeler' });
    });

  });


  describe('send()', function() {

    it('should not throw when there is no main window', function() {

      // given
      const { renderer } = loadRenderer();

      // then
      expect(() => renderer.send('menu:action', 'quit')).not.to.throw();
    });

  });

});
