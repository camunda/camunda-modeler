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

const log = require('../log')('app:template-updater');

const Queue = require('./queue');

const { updateTemplates } = require('./util');

const CONNECTOR_TEMPLATES_FILE_NAME = '.camunda-connector-templates.json';

module.exports.CONNECTOR_TEMPLATES_FILE_NAME = CONNECTOR_TEMPLATES_FILE_NAME;

const DEFAULT_ENDPOINTS = [
  {
    url: 'https://marketplace.cloud.camunda.io/api/v1/ootb-connectors',
    fileName: CONNECTOR_TEMPLATES_FILE_NAME
  }
];

const ONE_MINUTE_MILLISECONDS = 1000 * 60;

module.exports.TemplatesUpdater = class TemplatesUpdater extends EventEmitter {
  constructor(renderer, userPath) {
    super();

    this._renderer = renderer;
    this._userPath = userPath;

    this._queue = new Queue();

    this._queue.on('queue:empty', () => {
      renderer.send('client:templates-update-success');
    });

    this._executionPlatformVersions = new Set();

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
    this._executionPlatformVersions.add(executionPlatformVersion);

    for (const endpoint of this._endpoints) {
      const lastUpdate = endpoint.lastUpdate[executionPlatformVersion];

      if (lastUpdate && Date.now() - lastUpdate < ONE_MINUTE_MILLISECONDS) {
        log.info(`Skipping update for endpoint ${endpoint.url} as it was update less than a minute ago`);

        continue;
      }

      this._queue.add(async (prevResult = {}) => {
        if (!this._endpoints.includes(endpoint)) {
          log.info(`Skipping update for endpoint ${endpoint.url} as it was removed`);

          return prevResult;
        }

        const lastUpdate = endpoint.lastUpdate[executionPlatformVersion];

        if (lastUpdate && Date.now() - lastUpdate < ONE_MINUTE_MILLISECONDS) {
          log.info(`Skipping update for endpoint ${endpoint.url} as it was updated recently`);

          return prevResult;
        }

        const { hasNew, warnings } = await updateTemplates(endpoint, executionPlatformVersion, this._userPath);

        endpoint.lastUpdate[executionPlatformVersion] = Date.now();

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
  }
};