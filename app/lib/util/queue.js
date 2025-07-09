/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

class Queue {

  /**
   * @param { import('node:events').EventEmitter } eventBus
   */
  constructor(eventBus) {
    this.eventBus = eventBus;

    this.queue = Promise.resolve();

    this.pending = 0;
  }

  /**
   * Add a function that returns a promise to the queue.
   *
   * @param {() => Promise<any>} value
   *
   * @return {Promise<any>}
   */
  add(value) {
    this.pending++;

    const queue = this.queue = this.queue
      .then(() => value())
      .finally(() => {
        this.pending--;

        if (this.pending === 0) {
          this.eventBus.emit('workqueue:empty');
        }
      });

    return queue;
  }
}

module.exports = Queue;