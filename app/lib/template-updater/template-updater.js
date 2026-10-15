/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/**
 * @typedef {import('./types').Endpoint} Endpoint
 * @typedef {import('./types').TemplateUpdateResult} TemplateUpdateResult
 */

const { EventEmitter } = require('node:events');

const Queue = require('../util/queue');

const { updateTemplates } = require('./util');

const log = require('../log')('app:template-updater');

/** @type {Endpoint} */
const OOTB_CONNECTORS_ENDPOINT = {
  executionPlatform: 'Camunda Cloud',
  fileName: '.camunda-connector-templates.json',
  url: 'https://marketplace.cloud.camunda.io/api/v1/ootb-connectors'
};

module.exports.OOTB_CONNECTORS_ENDPOINT = OOTB_CONNECTORS_ENDPOINT;

module.exports.TemplateUpdater = class TemplateUpdater extends EventEmitter {
  constructor(userPath, endpoints) {
    super();

    this._userPath = userPath;
    this._endpoints = endpoints;

    /**
     * @type {Queue<TemplateUpdateResult>}
     */
    this._queue = new Queue();

    /**
     * @type {TemplateUpdateResult[]}
     */
    this._results = [];

    /**
     * Updates in flight, keyed by platform and version. Identical updates
     * requested while one is running join it instead of fetching twice,
     * e.g. when multiple restored tabs report the same engine profile.
     *
     * @type {Map<string, Promise<TemplateUpdateResult>>}
     */
    this._inflight = new Map();

    this._queue.onCompleted(result => {
      log.info('Templates update queue completed', result);

      this._results.push(result);
    });

    this._queue.onEmpty(() => {
      const results = combineResults(this._results);

      log.info('Templates update queue empty', results.hasNew, results.warnings);

      this.emit('update:done', results.hasNew, results.warnings);

      this._results = [];
    });
  }

  /**
   * Update templates for a specific execution platform and version.
   *
   * @param {string} executionPlatform
   * @param {string} executionPlatformVersion
   *
   * @returns {Promise<TemplateUpdateResult>}
   */
  async update(executionPlatform, executionPlatformVersion) {
    const key = `${ executionPlatform }@${ executionPlatformVersion }`;

    const inflight = this._inflight.get(key);

    if (inflight) {
      log.info(`Update for ${ key } already in progress, joining it`);

      return inflight;
    }

    const endpoints = this._endpoints.filter(endpoint => {
      return endpoint.executionPlatform === executionPlatform;
    });

    const update = Promise.all(endpoints.map(endpoint => this._queue.add(
      () => updateTemplates(endpoint, executionPlatformVersion, this._userPath)
    ))).then(combineResults);

    this._inflight.set(key, update);

    try {
      return await update;
    } finally {
      this._inflight.delete(key);
    }
  }
};

/**
 * Combine template update results.
 *
 * @param {TemplateUpdateResult[]} results
 *
 * @returns {TemplateUpdateResult}
 */
function combineResults(results) {
  return results.reduce((combined, { hasNew, warnings }) => {
    return {
      hasNew: combined.hasNew || hasNew,
      warnings: [ ...combined.warnings, ...warnings ]
    };
  }, { hasNew: false, warnings: [] });
}
