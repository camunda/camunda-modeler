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

const log = require('../log')('app:template-updater:queue');

module.exports = class Queue extends EventEmitter {

  /**
   * @type {Promise<any>}
   */
  _last = Promise.resolve();

  /**
   * @type {number}
   */
  _pending = 0;

  constructor() {
    super();
  }

  /**
   * Adds a function to the queue that returns a promise.
   *
   * @template T
   * @param {() => Promise<T>} fn - function returning a promise
   *
   * @return {Promise<T>}
   */
  add(fn) {
    this._pending++;

    this._last = this._last.then((prevResult) => {
      return fn(prevResult)
        .catch(error => {
          this.emit('queue:error', error);

          log.error('Queue error', error);

          this._pending--;

          log.info('Queue pending count', this._pending);

          if (this._pending === 0) {
            log.info('Queue is empty');

            this.emit('queue:empty', prevResult);
          }

          return prevResult;
        })
        .then((result) => {
          this._pending--;

          log.info('Queue pending count', this._pending);

          if (this._pending === 0) {
            log.info('Queue is empty');

            this.emit('queue:empty', result);
          }

          return result;
        });
    });

    return this._last;
  }
};
