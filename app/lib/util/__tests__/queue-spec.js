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

describe('queue', function() {

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
    const emptySpy = sinon.spy();

    queue.on('queue:empty', emptySpy);

    // when
    const result = await queue.add(() => Promise.resolve('foo'));

    // then
    expect(result).to.equal('foo');

    expect(emptySpy).to.have.been.calledOnce;
  });


  it('should handle multiple promises sequentially', async function() {

    // given
    const emptySpy = sinon.spy();

    queue.on('queue:empty', emptySpy);

    const results = [];

    // when
    queue.add(() => new Promise(resolve => {
      setTimeout(() => {
        results.push('foo');

        resolve();
      }, 100);
    }));

    queue.add(() => new Promise(resolve => {
      setTimeout(() => {
        results.push('bar');

        resolve();
      }, 50);
    }));

    const promise = queue.add(() => new Promise(resolve => {
      setTimeout(() => {
        results.push('baz');

        resolve();
      }, 150);
    }));

    await clock.tickAsync(1000);

    await promise;

    // then
    expect(results).to.deep.equal([ 'foo', 'bar', 'baz' ]);

    expect(emptySpy).to.have.been.calledOnce;
  });

});