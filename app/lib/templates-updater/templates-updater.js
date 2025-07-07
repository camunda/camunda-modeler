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

const ThrottledQueue = require('./throttled-queue');

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

    this._queue = new ThrottledQueue();

    this._queue.on('queue:empty', (result = {}) => {
      const { hasNew = false, warnings = [] } = result;

      log.info('Templates update', hasNew, warnings);

      renderer.send('client:templates-update-success', hasNew, warnings);
    });

    this._queue.on('queue:error', (error) => {
      log.error('Templates update error', error);

      renderer.send('client:templates-update-error', error);
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
    for (const endpoint of this._endpoints) {
      const key = `${endpoint.url}::${executionPlatformVersion}`;

      this._queue.add(key, async (prevResult = {}) => {
        const { hasNew, warnings } = await updateTemplates(endpoint, executionPlatformVersion, this._config, this._userPath);

        const {
          hasNew: prevHasNew = false,
          warnings: prevWarnings = []
        } = prevResult;

        return {
          hasNew: hasNew || prevHasNew,
          warnings: [ ...prevWarnings, ...warnings ]
        };
      });
    }

    return this._queue._last;
  }
};