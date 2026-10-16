/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');

const { OOTB_CONNECTORS_ENDPOINT } = require('./template-updater');
const { getTemplatesPath } = require('./util');

const log = require('../log')('app:template-sources');

const CUSTOM_CACHE_PATTERN = /^\.custom-element-templates-[0-9a-f]{64}\.json$/;

/**
 * Configure fetching and discovery of remote element templates for this session.
 * Custom sources are `{ name, url, enabled }` entries.
 * Disabled and removed source caches are ignored. Call
 * `cleanupTemplateSourcesCache` during application startup to delete
 * removed caches, after acquiring the application instance lock.
 *
 * @param {Object} options
 * @param {string} options.userPath
 * @param {Object} [options.settings] Persisted, flat application settings.
 * @param {Object} [options.flags] Application flags.
 *
 * @returns {{ endpoints: import('./types').Endpoint[], ignoredPaths: string[], cleanupTemplateSourcesCache: () => void }}
 */
function getTemplateSourceConfig({ userPath, settings = {}, flags }) {
  const endpoints = [];
  const ignoredPaths = [];
  const orphanedPaths = [];

  // a flag, if set, overrides the setting
  const disabledFlag = flags?.get('disable-connector-templates');

  const disabled = disabledFlag !== undefined
    ? disabledFlag
    : settings?.['app.disableConnectorTemplates'];

  if (disabled) {
    ignoredPaths.push(getTemplatesPath(userPath, OOTB_CONNECTORS_ENDPOINT.fileName));
  } else {
    endpoints.push(OOTB_CONNECTORS_ENDPOINT);
  }

  const sources = settings?.['app.customTemplateSources'];
  const seen = new Set();
  const configuredFiles = new Set();

  if (sources !== undefined && !Array.isArray(sources)) {
    log.warn('Ignoring invalid custom template sources: expected an array');
  }

  for (const [ index, source ] of (Array.isArray(sources) ? sources : []).entries()) {
    let url;

    try {
      url = normalizeSourceUrl(source?.url);
    } catch (error) {

      // Do not echo invalid input: it may contain credentials.
      log.warn(`Ignoring custom template source ${index + 1}: ${error.message}`);
      continue;
    }

    const hash = createHash('sha256').update(url).digest('hex');
    const fileName = `.custom-element-templates-${hash}.json`;

    configuredFiles.add(fileName);

    if (source?.enabled === false) {
      continue;
    }

    if (seen.has(url)) {
      log.warn(`Ignoring duplicate custom template source ${index + 1}`);
      continue;
    }

    seen.add(url);

    endpoints.push({
      executionPlatform: 'Camunda Cloud',
      fileName,
      url,
    });
  }

  const activeFiles = new Set(endpoints.map(({ fileName }) => fileName));
  const templatesDirectory = getTemplatesPath(userPath, '');

  try {
    for (const fileName of fs.readdirSync(templatesDirectory)) {
      if (CUSTOM_CACHE_PATTERN.test(fileName) && !activeFiles.has(fileName)) {
        const cachePath = path.join(templatesDirectory, fileName);

        if (!configuredFiles.has(fileName)) {
          orphanedPaths.push(cachePath);
        }

        ignoredPaths.push(cachePath);
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      log.warn('Could not list custom template caches', error);
    }
  }

  return {
    endpoints,
    ignoredPaths,
    cleanupTemplateSourcesCache() {
      for (const cachePath of orphanedPaths) {
        try {
          fs.unlinkSync(cachePath);
        } catch (error) {
          log.warn('Could not delete custom template cache', error);
        }
      }
    }
  };
}

module.exports.getTemplateSourceConfig = getTemplateSourceConfig;

// helpers //////////

function normalizeSourceUrl(source) {
  if (typeof source !== 'string' || !source.trim()) {
    throw new Error('expected a nonempty HTTP(S) URL');
  }

  let url;

  try {
    url = new URL(source.trim());
  } catch {
    throw new Error('expected a valid HTTP(S) URL');
  }

  if (![ 'http:', 'https:' ].includes(url.protocol) || url.username || url.password) {
    throw new Error('expected an HTTP(S) URL without credentials');
  }

  url.hash = '';

  return url.href;
}
