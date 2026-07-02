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

const OpenFileHandler = require('../open-file-handler');


describe('open-file-handler', function() {

  let ready,
      readFile,
      onError,
      onOpen,
      openFileHandler;

  beforeEach(function() {
    ready = true;

    readFile = sinon.stub().callsFake(filePath => ({ path: filePath }));
    onError = sinon.spy();
    onOpen = sinon.spy();

    openFileHandler = OpenFileHandler({
      isReady: () => ready,
      readFile,
      onError,
      onOpen
    });
  });


  it('should open files immediately when client is ready', function() {

    // when
    openFileHandler.open([ 'a.bpmn' ]);

    // then
    expect(readFile).to.have.been.calledOnceWith('a.bpmn');
    expect(onOpen).to.have.been.calledOnceWith([ { path: 'a.bpmn' } ]);
    expect(onError).not.to.have.been.called;
  });


  it('should show error and still open remaining files when a file fails to read', function() {

    // given
    readFile.withArgs('missing.bpmn').throws(new Error('ENOENT'));

    // when
    openFileHandler.open([ 'missing.bpmn', 'ok.bpmn' ]);

    // then
    expect(onError).to.have.been.calledOnceWith('missing.bpmn');
    expect(onOpen).to.have.been.calledOnceWith([ { path: 'ok.bpmn' } ]);
  });


  it('should defer opening files when client is not ready', function() {

    // given
    ready = false;

    // when
    openFileHandler.open([ 'a.bpmn' ]);

    // then
    expect(readFile).not.to.have.been.called;
    expect(onOpen).not.to.have.been.called;
  });


  it('should open deferred files on drain', function() {

    // given
    ready = false;
    openFileHandler.open([ 'a.bpmn', 'b.bpmn' ]);

    // when
    ready = true;
    openFileHandler.drain();

    // then
    expect(onOpen).to.have.been.calledOnceWith([
      { path: 'a.bpmn' },
      { path: 'b.bpmn' }
    ]);
  });


  it('should not replay drained files on a subsequent drain', function() {

    // given
    ready = false;
    openFileHandler.open([ 'a.bpmn' ]);

    ready = true;
    openFileHandler.drain();

    // when
    openFileHandler.drain();

    // then
    expect(onOpen).to.have.been.calledOnce;
    expect(readFile).to.have.been.calledOnce;
  });


  it('should not replay files across close/reopen cycles', function() {

    // given
    ready = false;
    openFileHandler.open([ 'a.bpmn' ]);

    ready = true;
    openFileHandler.drain();

    // when
    ready = false;
    openFileHandler.open([ 'b.bpmn' ]);

    ready = true;
    openFileHandler.drain();

    // then
    expect(onOpen).to.have.been.calledTwice;
    expect(onOpen.secondCall).to.have.been.calledWith([ { path: 'b.bpmn' } ]);
  });


  it('should not queue duplicate file paths', function() {

    // given
    ready = false;
    openFileHandler.open([ 'a.bpmn' ]);
    openFileHandler.open([ 'a.bpmn' ]);

    // when
    ready = true;
    openFileHandler.drain();

    // then
    expect(readFile).to.have.been.calledOnce;
    expect(onOpen).to.have.been.calledOnceWith([ { path: 'a.bpmn' } ]);
  });


  it('should show the error dialog only once for a duplicated missing file', function() {

    // given
    readFile.withArgs('missing.bpmn').throws(new Error('ENOENT'));

    ready = false;
    openFileHandler.open([ 'missing.bpmn' ]);
    openFileHandler.open([ 'missing.bpmn' ]);

    // when
    ready = true;
    openFileHandler.drain();

    // then
    expect(onError).to.have.been.calledOnce;
    expect(onOpen).to.have.been.calledOnceWith([]);
  });


  it('should keep files queued when drained while not ready', function() {

    // given
    ready = false;
    openFileHandler.open([ 'a.bpmn' ]);
    openFileHandler.drain();

    // when
    ready = true;
    openFileHandler.drain();

    // then
    expect(onOpen).to.have.been.calledOnceWith([ { path: 'a.bpmn' } ]);
  });

});
