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

const log = require('../log')('app:templates-updater:throttled-queue');

const Queue = require('./queue');

const DEFAULT_THROTTLE_TIME = 60 * 1000;

module.exports = class ThrottledQueue extends EventEmitter {
  constructor(throttleTime = DEFAULT_THROTTLE_TIME) {
    super();

    this._queue = new Queue();

    this._throttleTime = throttleTime;

    this._lastExecutions = new Map();

    this._queue.on('queue:empty', (result) => this.emit('queue:empty', result));
    this._queue.on('queue:error', (error) => this.emit('queue:error', error));
  }

  /**
   * Adds a throttled function to the queue that returns a promise.
   *
   * @param {any} key - Throttling key
   * @param {(prevResult: any) => Promise<any>} fn - Function
   *
   * @returns {Promise<any>}
   */
  add(key, fn) {
    return this._queue.add(async (prevResult) => {
      const now = Date.now();

      log.debug(JSON.stringify(this._lastExecutions, null, 2));

      const lastExecution = this._lastExecutions.get(key);

      if (lastExecution && now - lastExecution < this._throttleTime) {
        log.debug(`Throttled function for key "${key}" skipped, last execution was ${Math.round((now - lastExecution) / 1000)} seconds ago`);

        return prevResult;
      }

      this._lastExecutions.set(key, now);

      return fn(prevResult).then(result => {
        log.debug(`Throttled function for key "${key}" executed`);

        return result;
      });
    });
  }

  get _last() {
    return this._queue._last;
  }
};
