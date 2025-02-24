/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

module.exports = class Workqueue {

  /**
   * @type { Set<Promise<any>> }
   */
  queue = new Set();

  /**
   * @param { import('node:events').EventEmitter } eventBus
   */
  constructor(eventBus) {
    this.eventBus = eventBus;
  }

  /**
   * Add work queue item.
   *
   * @template T
   *
   * @param {Promise<T>} value
   *
   * @return { Promise<T> }
   */
  add(value) {

    this.queue.add(value);

    return value.finally(() => {
      this.queue.delete(value);

      if (this.queue.size === 0) {
        this.eventBus.emit('workqueue:empty');
      }
    });
  }

};