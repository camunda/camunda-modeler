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
 * Removed-source caches are ignored, not deleted, so re-adding a URL can reuse them.
 *
 * @param {Object} options
 * @param {string} options.userPath
 * @param {Object} [options.settings] Persisted, flat application settings.
 * @param {Object} [options.flags] Application flags.
 *
 * @returns {{ endpoints: import('./types').Endpoint[], templateSourcePaths: string[], ignoredPaths: string[] }}
 */
function getTemplateSourceConfig({ userPath, settings = {}, flags }) {
  const endpoints = [];
  const ignoredPaths = [];

  const disabled =
    flags?.get('disable-connector-templates', false) || settings?.['app.disableConnectorTemplates'];

  if (disabled) {
    ignoredPaths.push(getTemplatesPath(userPath, OOTB_CONNECTORS_ENDPOINT.fileName));
  } else {
    endpoints.push(OOTB_CONNECTORS_ENDPOINT);
  }

  const sources = settings?.['app.customTemplateSources'];
  const seen = new Set();

  if (sources !== undefined && !Array.isArray(sources)) {
    log.warn('Ignoring invalid custom template sources: expected an array');
  }

  for (const [ index, source ] of (Array.isArray(sources) ? sources : []).entries()) {
    let url;

    try {
      url = normalizeSourceUrl(source);
    } catch (error) {

      // Do not echo invalid input: it may contain credentials.
      log.warn(`Ignoring custom template source ${index + 1}: ${error.message}`);
      continue;
    }

    if (seen.has(url)) {
      log.warn(`Ignoring duplicate custom template source ${index + 1}`);
      continue;
    }

    seen.add(url);

    const hash = createHash('sha256').update(url).digest('hex');

    endpoints.push({
      executionPlatform: 'Camunda Cloud',
      fileName: `.custom-element-templates-${hash}.json`,
      url,
    });
  }

  const templateSourcePaths = endpoints.map(({ fileName }) => getTemplatesPath(userPath, fileName));
  const activeFiles = new Set(endpoints.map(({ fileName }) => fileName));
  const templatesDirectory = getTemplatesPath(userPath, '');

  try {
    for (const fileName of fs.readdirSync(templatesDirectory)) {
      if (CUSTOM_CACHE_PATTERN.test(fileName) && !activeFiles.has(fileName)) {
        ignoredPaths.push(path.join(templatesDirectory, fileName));
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      log.warn('Could not list custom template caches', error);
    }
  }

  return { endpoints, templateSourcePaths, ignoredPaths };
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
