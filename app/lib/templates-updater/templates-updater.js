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

const CONNECTOR_TEMPLATES_FILE_NAME = '.camunda-connector-templates.json';

module.exports.CONNECTOR_TEMPLATES_FILE_NAME = CONNECTOR_TEMPLATES_FILE_NAME;

const DEFAULT_ENDPOINTS = [
  {
    url: 'https://marketplace.cloud.camunda.io/api/v1/ootb-connectors',
    fileName: CONNECTOR_TEMPLATES_FILE_NAME
  }
];

module.exports.TemplatesUpdater = class TemplatesUpdater extends EventEmitter {
  constructor(renderer, config, userPath) {
    super();

    this._renderer = renderer;
    this._config = config;
    this._userPath = userPath;

    this._queue = new Queue({ concurrency: 1 });

    this._results = [];

    this._queue.onIdle(() => {
      const results = this._results.reduce((results, { hasNew, warnings }) => {
        return {
          hasNew: results.hasNew || hasNew,
          warnings: [ ...results.warnings, ...warnings ]
        };
      }, { hasNew: false, warnings: [] });

      log.info('Templates update success', results.hasNew, results.warnings);

      renderer.send('client:templates-update-success', results.hasNew, results.warnings);

      this._results = [];
    });

    this._endpoints = DEFAULT_ENDPOINTS.map(endpoint => {
      return {
        ...endpoint,
        lastUpdate: {}
      };
    });

    renderer.on('client:templates-update', ({ executionPlatform, executionPlatformVersion }) => {
      if (executionPlatform === 'Camunda Cloud') {
        this.update(executionPlatformVersion);
      }
    });
  }

  update(executionPlatformVersion) {
    let lastPromise = Promise.resolve();

    for (const endpoint of this._endpoints) {
      lastPromise = this._queue.add(async () => {
        const { hasNew, warnings } = await updateTemplates(endpoint, executionPlatformVersion, this._config, this._userPath);

        this._results.push({ hasNew, warnings });

        return this._results;
      });
    }

    return lastPromise;
  }
};