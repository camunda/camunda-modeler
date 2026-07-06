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
const { EventEmitter } = require('events');

const OpenFileHandler = require('../open-file-handler');


describe('open-file-handler', function() {

  let app,
      readFile,
      onError,
      renderer,
      openFileHandler;

  beforeEach(function() {
    app = Object.assign(new EventEmitter(), {
      clientReady: false
    });

    readFile = sinon.stub().callsFake(filePath => ({ path: filePath }));
    onError = sinon.spy();
    renderer = {
      send: sinon.spy()
    };

    openFileHandler = OpenFileHandler({
      app,
      readFile,
      onError,
      renderer
    });
  });


  it('should open files immediately when client is ready', function() {

    // given
    app.clientReady = true;

    // when
    openFileHandler.open([ 'a.bpmn' ]);

    // then
    expect(readFile).to.have.been.calledOnceWith('a.bpmn');
    expect(renderer.send).to.have.been.calledOnceWith('client:open-files', [ { path: 'a.bpmn' } ]);
    expect(onError).not.to.have.been.called;
  });


  it('should show error and still open remaining files when a file fails to read', function() {

    // given
    app.clientReady = true;
    readFile.withArgs('missing.bpmn').throws(new Error('ENOENT'));

    // when
    openFileHandler.open([ 'missing.bpmn', 'ok.bpmn' ]);

    // then
    expect(onError).to.have.been.calledOnceWith('missing.bpmn');
    expect(renderer.send).to.have.been.calledOnceWith('client:open-files', [ { path: 'ok.bpmn' } ]);
  });


  it('should defer opening files when client is not ready', function() {

    // given
    app.clientReady = false;

    // when
    openFileHandler.open([ 'a.bpmn' ]);

    // then
    expect(readFile).not.to.have.been.called;
    expect(renderer.send).not.to.have.been.called;
  });


  it('should open deferred files on client-ready', function() {

    // given
    app.clientReady = false;
    openFileHandler.open([ 'a.bpmn', 'b.bpmn' ]);

    // when
    app.clientReady = true;
    app.emit('app:client-ready');

    // then
    expect(renderer.send).to.have.been.calledOnceWith('client:open-files', [
      { path: 'a.bpmn' },
      { path: 'b.bpmn' }
    ]);
  });


  it('should not replay drained files on a subsequent client-ready', function() {

    // given
    app.clientReady = false;
    openFileHandler.open([ 'a.bpmn' ]);

    app.clientReady = true;
    app.emit('app:client-ready');

    // when
    app.emit('app:client-ready');

    // then
    expect(renderer.send).to.have.been.calledOnce;
    expect(readFile).to.have.been.calledOnce;
  });


  it('should not replay files across close/reopen cycles', function() {

    // given
    app.clientReady = false;
    openFileHandler.open([ 'a.bpmn' ]);

    app.clientReady = true;
    app.emit('app:client-ready');

    // when
    app.clientReady = false;
    openFileHandler.open([ 'b.bpmn' ]);

    app.clientReady = true;
    app.emit('app:client-ready');

    // then
    expect(renderer.send).to.have.been.calledTwice;
    expect(renderer.send.secondCall).to.have.been.calledWith('client:open-files', [ { path: 'b.bpmn' } ]);
  });


  it('should not queue duplicate file paths', function() {

    // given
    app.clientReady = false;
    openFileHandler.open([ 'a.bpmn' ]);
    openFileHandler.open([ 'a.bpmn' ]);

    // when
    app.clientReady = true;
    app.emit('app:client-ready');

    // then
    expect(readFile).to.have.been.calledOnce;
    expect(renderer.send).to.have.been.calledOnceWith('client:open-files', [ { path: 'a.bpmn' } ]);
  });


  it('should show the error dialog only once for a duplicated missing file', function() {

    // given
    readFile.withArgs('missing.bpmn').throws(new Error('ENOENT'));

    app.clientReady = false;
    openFileHandler.open([ 'missing.bpmn' ]);
    openFileHandler.open([ 'missing.bpmn' ]);

    // when
    app.clientReady = true;
    app.emit('app:client-ready');

    // then
    expect(onError).to.have.been.calledOnce;
    expect(renderer.send).to.have.been.calledOnceWith('client:open-files', []);
  });


  it('should keep files queued when drained while not ready', function() {

    // given
    app.clientReady = false;
    openFileHandler.open([ 'a.bpmn' ]);
    openFileHandler.drain();

    // when
    app.clientReady = true;
    app.emit('app:client-ready');

    // then
    expect(renderer.send).to.have.been.calledOnceWith('client:open-files', [ { path: 'a.bpmn' } ]);
  });

});
