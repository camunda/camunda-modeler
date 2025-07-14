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

const Queue = require('../queue');


describe('util - queue', function() {

  /**
   * @type { Queue<string> }
   */
  let queue;

  beforeEach(function() {
    queue = new Queue();
  });

  let clock;

  beforeEach(function() {
    clock = sinon.useFakeTimers();
  });

  afterEach(function() {
    clock.restore();
  });


  it('should handle promise', async function() {

    // given
    const nextSpy = /** @type { (result: string) => void } */ (sinon.spy());
    const emptySpy = sinon.spy();

    queue.onCompleted(nextSpy);
    queue.onEmpty(emptySpy);

    // when
    const result = await queue.add(() => Promise.resolve('foo'));

    // then
    expect(result).to.equal('foo');

    expect(nextSpy).to.have.been.calledOnce;
    expect(nextSpy).to.have.been.calledWith('foo');

    expect(emptySpy).to.have.been.calledOnce;
  });


  it('should handle plain value', async function() {

    // given
    const nextSpy = /** @type { (result: string) => } */ (sinon.spy());
    const emptySpy = sinon.spy();

    queue.onCompleted(nextSpy);
    queue.onEmpty(emptySpy);

    // when
    const result = await queue.add(() => 'foo');

    // then
    expect(result).to.equal('foo');

    expect(nextSpy).to.have.been.calledOnce;
    expect(nextSpy).to.have.been.calledWith('foo');

    expect(emptySpy).to.have.been.calledOnce;
  });


  it('should handle multiple promises sequentially', async function() {

    // given
    const nextSpy = /** @type { (result: string) => } */ (sinon.spy());
    const emptySpy = sinon.spy();

    queue.onCompleted(nextSpy);
    queue.onEmpty(emptySpy);

    // when
    queue.add(() => new Promise(resolve => {
      setTimeout(() => resolve('foo'), 100);
    }));

    queue.add(() => new Promise(resolve => {
      setTimeout(() => resolve('bar'), 50);
    }));

    const promise = queue.add(() => new Promise(resolve => {
      setTimeout(() => resolve('baz'), 150);
    }));

    await clock.tickAsync(1000);

    await promise;

    // then
    expect(nextSpy).to.have.been.calledThrice;
    expect(nextSpy.getCall(0)).to.have.been.calledWith('foo');
    expect(nextSpy.getCall(1)).to.have.been.calledWith('bar');
    expect(nextSpy.getCall(2)).to.have.been.calledWith('baz');

    expect(emptySpy).to.have.been.calledOnce;
  });

});
