/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const { EventEmitter } = require('node:events');

/**
 * A queue that serializes promise-returning functions and emits events on progress.
 *
 * @template T
 */
class Queue extends EventEmitter {
  constructor() {
    super();

    this.queue = Promise.resolve();

    this.pending = 0;
  }

  /**
   * Adds a particular task to the queue.
   *
   * Returns a promise to the result.
   *
   * @param {() => Promise<T> | T} taskFn
   *
   * @returns {Promise<T>}
   */
  add(taskFn) {
    this.pending++;

    const queue = this.queue = this.queue
      .then(() => taskFn())
      .then((result) => {
        this.emit('completed', result);

        return result;
      })
      .finally(() => {
        this.pending--;

        if (this.pending === 0) {
          this.emit('empty');
        }
      });

    return queue;
  }

  /**
   * @param { (taskResult: T) => void } callbackFn
   */
  onCompleted(callbackFn) {
    this.on('completed', callbackFn);
  }

  /**
   * @param { () => void } callbackFn
   */
  onEmpty(callbackFn) {
    this.on('empty', callbackFn);
  }
}

module.exports = Queue;
