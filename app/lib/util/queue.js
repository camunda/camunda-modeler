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
 * Emitted when a queued function has completed.
 *
 * @event Queue#queue:completed
 * @type {any}
 * @property {any} result - The result value returned by the resolved promise.
 */

/**
 * Emitted when the queue becomes empty (all pending functions have completed).
 *
 * @event Queue#queue:empty
 */

/**
 * A queue that serializes promise-returning functions and emits events on progress.
 *
 * @extends EventEmitter
 *
 * @fires Queue#queue:completed
 * @fires Queue#queue:empty
 */
class Queue extends EventEmitter {
  constructor() {
    super();

    this.queue = Promise.resolve();

    this.pending = 0;
  }

  /**
   * Add a function that returns a promise to the queue.
   *
   * @param {() => Promise<any>} fn
   *
   * @returns {Promise<any>}
   *
   * @fires Queue#queue:completed
   * @fires Queue#queue:empty
   */
  add(fn) {
    this.pending++;

    const queue = this.queue = this.queue
      .then(() => fn())
      .then((result) => {
        this.emit('queue:completed', result);

        return result;
      })
      .finally(() => {
        this.pending--;

        if (this.pending === 0) {
          this.emit('queue:empty');
        }
      });

    return queue;
  }
}

module.exports = Queue;