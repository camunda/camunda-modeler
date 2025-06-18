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

describe('Queue', function() {

  it('should execute single function', async function() {

    // given
    const q = new Queue();

    // when
    const result = await q.add(() => Promise.resolve('foo'));

    // then
    expect(result).to.equal('foo');
  });


  it('should execute multiple functions in order', async function() {

    // given
    const q = new Queue();

    // when
    q.add(() => Promise.resolve('foo'));
    q.add((prevResult) => Promise.resolve(`${prevResult}bar`));
    const result = await q.add((prevResult) => Promise.resolve(`${prevResult}baz`));

    // then
    expect(result).to.equal('foobarbaz');
  });


  it('should pass previous result to next function', async function() {

    // given
    const q = new Queue();

    const fnSpy = sinon.spy(() => Promise.resolve());

    // when
    q.add(() => Promise.resolve('foo'));
    await q.add(fnSpy);

    // then
    expect(fnSpy).to.have.been.calledWith('foo');
  });


  describe('events', function() {

    it('should emit "queue:empty" when the queue becomes empty', async function() {

      // given
      const q = new Queue();
      const emptySpy = sinon.spy();

      q.on('queue:empty', emptySpy);

      // when
      await q.add(() => Promise.resolve('foo'));

      // then
      expect(emptySpy).to.have.been.calledOnce;
    });

  });


  describe('error handling', function() {

    it('should emit "queue:error" on error', async function() {

      // given
      const q = new Queue();
      const errorSpy = sinon.spy();

      q.on('queue:error', errorSpy);

      // when
      await q.add(() => Promise.reject(new Error('error')));

      // then
      expect(errorSpy).to.have.been.calledOnce;
    });


    it('should continue after an error', async function() {

      // given
      const q = new Queue();

      // when
      q.add(() => Promise.resolve('foo'));
      q.add(() => Promise.reject(new Error('error')));
      const result = await q.add((prevResult) => Promise.resolve(`${prevResult}bar`));

      // then
      expect(result).to.equal('foobar');
    });

  });

});