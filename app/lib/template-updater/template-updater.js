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

const Queue = require('p-queue');

const { updateTemplates } = require('./util');

const log = require('../log')('app:templates-updater');

const OOTB_CONNECTORS_ENDPOINT = {
  url: 'https://marketplace.cloud.camunda.io/api/v1/ootb-connectors',
  fileName: '.camunda-connector-templates.json',
  executionPlatform: 'Camunda Cloud'
};

module.exports.OOTB_CONNECTORS_ENDPOINT = OOTB_CONNECTORS_ENDPOINT;


module.exports.TemplateUpdater = class TemplateUpdater extends EventEmitter {
  constructor(config, userPath) {
    super();

    this._config = config;
    this._userPath = userPath;

    this._queue = new Queue({ concurrency: 1 });

    this._results = [];

    this._queue.onIdle(() => {
      const {
        hasNew,
        warnings
      } = this._results.reduce((results, { hasNew, warnings }) => {
        return {
          hasNew: results.hasNew || hasNew,
          warnings: [ ...results.warnings, ...warnings ]
        };
      }, { hasNew: false, warnings: [] });

      this._results = [];

      log.info('Templates update success', {
        hasNew,
        warnings
      });

      this.emit('update-done', {
        hasNew,
        warnings
      });
    });

    // TODO: consult config.ignoredPaths to see which templates to actually update
    this._endpoints = [ OOTB_CONNECTORS_ENDPOINT ].map(endpoint => {
      return {
        ...endpoint,
        lastUpdate: {}
      };
    });

  }

  /**
   * @type { (hasNew: boolean, warnings: Error[] ) => { } } fn
   */
  onUpdated(fn) {
    this.on('update-done', fn);
  }

  /**
   * @param {string} executionPlatform
   * @param {string} executionPlatformVersion
   *
   * @return {Promise}
   */
  updateTemplates(executionPlatform, executionPlatformVersion) {

    const actualEndpoints = this._endpoints
      .filter(endpoint => endpoint.executionPlatform === executionPlatform);

    const tasks = actualEndpoints.map(
      endpoint => updateTemplates(endpoint, executionPlatformVersion, this._config, this._userPath)
        .then(({ hasNew, warnings }) => this._results.push({ hasNew, warnings }))
    );

    return Promise.all(tasks);
  }
};
