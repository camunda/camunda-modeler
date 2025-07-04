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

const ThrottledQueue = require('../throttled-queue');

describe('ThrottledQueue', function() {

  it('should execute single function', async function() {

    // given
    const q = new ThrottledQueue();

    // when
    const result = await q.add('foo', () => Promise.resolve('foo'));

    // then
    expect(result).to.equal('foo');
  });


  it('should execute multiple functions in order', async function() {

    // given
    const q = new ThrottledQueue();

    // when
    q.add('foo', () => Promise.resolve('foo'));
    q.add('bar', (prevResult) => Promise.resolve(`${prevResult}bar`));
    const result = await q.add('baz', (prevResult) => Promise.resolve(`${prevResult}baz`));

    // then
    expect(result).to.equal('foobarbaz');
  });


  it('should pass previous result to next function', async function() {

    // given
    const q = new ThrottledQueue();

    const fnSpy = sinon.spy(() => Promise.resolve());

    // when
    q.add('foo', () => Promise.resolve('foo'));
    await q.add('bar', fnSpy);

    // then
    expect(fnSpy).to.have.been.calledWith('foo');
  });


  describe('throttling', function() {

    let clock;

    beforeEach(function() {
      clock = sinon.useFakeTimers();
    });

    afterEach(function() {
      clock.restore();
    });


    it('should skip function if last execution was less than 1 minute ago', async function() {

      // given
      const q = new ThrottledQueue();
      const fnSpy = sinon.spy(() => Promise.resolve('foo'));

      // when
      const firstCall = q.add('foo', fnSpy);
      await clock.tick(10);
      await firstCall;

      await clock.tick(30 * 1000); // advance time by 30 seconds

      const secondCall = q.add('foo', fnSpy);
      await clock.tickAsync(10);
      await secondCall;

      // then
      expect(fnSpy).to.have.been.calledOnce;
    });


    it('should execute function if last execution was more than 1 minute ago', async function() {

      // given
      const q = new ThrottledQueue();
      const fnSpy = sinon.spy(() => Promise.resolve('foo'));

      // when
      const firstCall = q.add('foo', fnSpy);
      await clock.tick(10);
      await firstCall;

      clock.tick(90 * 1000); // advance time by 90 seconds

      const secondCall = q.add('foo', fnSpy);
      await clock.tickAsync(10);
      await secondCall;

      // then
      expect(fnSpy).to.have.been.calledTwice;
    });


    it('should not skip function if key is different', async function() {

      // given
      const q = new ThrottledQueue();
      const fnSpy = sinon.spy(() => Promise.resolve('foo'));

      // when
      const firstCall = q.add('foo', fnSpy);
      await clock.tick(10);
      await firstCall;

      clock.tick(30 * 1000); // advance time by 30 seconds

      const secondCall = q.add('bar', fnSpy);
      await clock.tickAsync(10);
      await secondCall;

      // then
      expect(fnSpy).to.have.been.calledTwice;
    });

  });


  describe('events', function() {

    it('should emit "queue:empty" when the queue becomes empty', async function() {

      // given
      const q = new ThrottledQueue();
      const emptySpy = sinon.spy();

      q.on('queue:empty', emptySpy);

      // when
      await q.add('foo', () => Promise.resolve('foo'));

      // then
      expect(emptySpy).to.have.been.calledOnce;
    });

  });


  describe('error handling', function() {

    it('should emit "queue:error" on error', async function() {

      // given
      const q = new ThrottledQueue();
      const errorSpy = sinon.spy();

      q.on('queue:error', errorSpy);

      // when
      await q.add('foo', () => Promise.reject(new Error('error')));

      // then
      expect(errorSpy).to.have.been.calledOnce;
    });


    it('should continue after an error', async function() {

      // given
      const q = new ThrottledQueue();

      // when
      q.add('foo', () => Promise.resolve('foo'));
      q.add('bar', () => Promise.reject(new Error('error')));
      const result = await q.add('baz', (prevResult) => Promise.resolve(`${prevResult}bar`));

      // then
      expect(result).to.equal('foobar');
    });

  });

});