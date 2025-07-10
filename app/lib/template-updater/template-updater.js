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
 * @typedef { {
 *   url: string;
 *   fileName: string;
 *   lastUpdate: { [version: string]: number }
 * } } Endpoint
 */

const { EventEmitter } = require('node:events');

const Queue = require('../util/queue');

const { updateTemplates } = require('./util');

const log = require('../log')('app:template-updater');

const OOTB_CONNECTORS_ENDPOINT = {
  executionPlatform: 'Camunda Cloud',
  fileName: '.camunda-connector-templates.json',
  url: 'https://marketplace.cloud.camunda.io/api/v1/ootb-connectors'
};

module.exports.OOTB_CONNECTORS_ENDPOINT = OOTB_CONNECTORS_ENDPOINT;

const DEFAULT_ENDPOINTS = [
  OOTB_CONNECTORS_ENDPOINT
];

module.exports.TemplateUpdater = class TemplateUpdater extends EventEmitter {
  constructor(config, userPath, endpoints = DEFAULT_ENDPOINTS) {
    super();

    this._config = config;
    this._userPath = userPath;
    this._endpoints = endpoints;

    this._queue = new Queue();

    this._results = [];

    this._queue.on('queue:empty', () => {
      const results = combineResults(this._results);

      log.info('Templates update success', results.hasNew, results.warnings);

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
   * @returns {Promise<any[]>}
   */
  update(executionPlatform, executionPlatformVersion) {
    const endpoints = this._endpoints.filter(endpoint => {
      return endpoint.executionPlatform === executionPlatform;
    });

    let promise = Promise.resolve();

    let results = [];

    for (const endpoint of endpoints) {
      promise = this._queue.add(async () => {
        const { hasNew, warnings } = await updateTemplates(endpoint, executionPlatformVersion, this._config, this._userPath);

        this._results.push({ hasNew, warnings });

        results.push({ hasNew, warnings });
      });
    }

    return promise.then(() => combineResults(results));
  }
};

function combineResults(results) {
  return results.reduce((combined, { hasNew, warnings }) => {
    return {
      hasNew: combined.hasNew || hasNew,
      warnings: [ ...combined.warnings, ...warnings ]
    };
  }, { hasNew: false, warnings: [] });
}