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

const log = require('../log')('app:templates-updater:queue');

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
   * @param {(prevResult: any) => Promise<any>} fn - Function
   *
   * @returns {Promise<any>}
   */
  add(fn) {
    this._pending++;

    this._last = this._last.then(async (prevResult) => {
      let result;

      try {
        result = await fn(prevResult);

        return result;
      } catch (error) {
        this.emit('queue:error', error);

        log.error('Queue error', error);

        return prevResult;
      } finally {
        this._pending--;

        log.debug('Queue pending count', this._pending);

        if (this._pending === 0) {
          log.debug('Queue is empty');

          this.emit('queue:empty', result);

          this._last = Promise.resolve();
        }
      }
    });

    return this._last;
  }
};
