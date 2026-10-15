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

const fs = require('node:fs');

const Queue = require('../util/queue');

const { updateTemplates, getTemplatesPath } = require('./util');

const log = require('../log')('app:template-updater');

const CUSTOM_CACHE_PATTERN = /^\.custom-element-templates-[0-9a-f]{64}\.json$/;

/** @type {Endpoint} */
const OOTB_CONNECTORS_ENDPOINT = {
  executionPlatform: 'Camunda Cloud',
  fileName: '.camunda-connector-templates.json',
  url: 'https://marketplace.cloud.camunda.io/api/v1/ootb-connectors'
};

module.exports.OOTB_CONNECTORS_ENDPOINT = OOTB_CONNECTORS_ENDPOINT;

module.exports.TemplateUpdater = class TemplateUpdater extends EventEmitter {

  /**
   * @param {string} userPath
   * @param {import('./sources').TemplateSource[]} sources
   */
  constructor(userPath, sources) {
    super();

    this._userPath = userPath;
    this._sources = sources;

    /**
     * @type {Queue<TemplateUpdateResult>}
     */
    this._queue = new Queue();

    /**
     * @type {TemplateUpdateResult[]}
     */
    this._results = [];

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
   * The cache files to exclude when loading templates from disk: caches of
   * disabled sources (kept on disk, so re-enabling a source is instant) and
   * caches whose source is no longer configured.
   *
   * @returns {string[]}
   */
  getIgnoredCachePaths() {
    const templatesDirectory = getTemplatesPath(this._userPath, '');

    const knownFiles = new Set(this._sources.map(({ fileName }) => fileName));

    const ignoredPaths = this._sources
      .filter(({ enabled }) => !enabled)
      .map(({ fileName }) => getTemplatesPath(this._userPath, fileName));

    let cacheFiles;

    try {
      cacheFiles = fs.readdirSync(templatesDirectory);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        log.warn('Could not list template caches', error);
      }

      return ignoredPaths;
    }

    for (const fileName of cacheFiles) {
      if (CUSTOM_CACHE_PATTERN.test(fileName) && !knownFiles.has(fileName)) {
        ignoredPaths.push(getTemplatesPath(this._userPath, fileName));
      }
    }

    return ignoredPaths;
  }

  /**
   * Remove the caches of removed sources.
   *
   * The updater owns the cache lifecycle: it writes caches on update, and
   * deletes the ones whose source is gone.
   */
  reapOrphanedCaches() {
    const templatesDirectory = getTemplatesPath(this._userPath, '');

    const knownFiles = new Set(this._sources.map(({ fileName }) => fileName));

    let cacheFiles;

    try {
      cacheFiles = fs.readdirSync(templatesDirectory);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        log.warn('Could not list template caches', error);
      }

      return;
    }

    for (const fileName of cacheFiles) {
      if (!CUSTOM_CACHE_PATTERN.test(fileName) || knownFiles.has(fileName)) {
        continue;
      }

      try {
        fs.unlinkSync(getTemplatesPath(this._userPath, fileName));
        log.info(`Removed cache of removed template source: ${ fileName }`);
      } catch (error) {
        log.warn(`Could not remove template cache ${ fileName }`, error);
      }
    }
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
    const endpoints = this._sources.filter(source => {
      return source.enabled && source.executionPlatform === executionPlatform;
    });

    const promises = endpoints.map(endpoint => this._queue.add(
      () => updateTemplates(endpoint, executionPlatformVersion, this._userPath)
    ));

    const results = await Promise.all(promises);

    return combineResults(results);
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
