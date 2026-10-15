/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const { createHash } = require('crypto');

const { OOTB_CONNECTORS_ENDPOINT } = require('./template-updater');

const log = require('../log')('app:template-sources');

/**
 * A template source resolved from settings and flags.
 *
 * @typedef {Object} TemplateSource
 * @property {string} executionPlatform
 * @property {string} url
 * @property {string} fileName Name of the source's cache file.
 * @property {boolean} enabled Disabled sources keep their cache, so
 *   re-enabling them is instant; they are not fetched.
 */

/**
 * Resolve the template sources for this session from settings and flags.
 *
 * Pure: derives policy (which sources exist, are they enabled, which cache
 * file backs them) without touching the file system. The `TemplateUpdater`
 * fetches enabled sources and owns their caches, including the removal of
 * caches whose source was removed.
 *
 * Custom sources are `{ name, url, enabled }` entries.
 *
 * @param {Object} options
 * @param {Object} [options.settings] Persisted, flat application settings.
 * @param {Object} [options.flags] Application flags.
 *
 * @returns {{ sources: TemplateSource[] }}
 */
function resolveTemplateSources({ settings = {}, flags }) {
  const sources = [];

  // a flag, if set, overrides the setting
  const disabledFlag = flags?.get('disable-connector-templates');

  const connectorsDisabled = disabledFlag !== undefined
    ? disabledFlag
    : settings?.['app.disableConnectorTemplates'];

  sources.push({
    ...OOTB_CONNECTORS_ENDPOINT,
    enabled: !connectorsDisabled
  });

  const customSources = settings?.['app.customTemplateSources'];
  const seen = new Set();

  if (customSources !== undefined && !Array.isArray(customSources)) {
    log.warn('Ignoring invalid custom template sources: expected an array');
  }

  for (const [ index, source ] of (Array.isArray(customSources) ? customSources : []).entries()) {

    let url;

    try {
      url = normalizeSourceUrl(source?.url);
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

    sources.push({
      executionPlatform: 'Camunda Cloud',
      fileName: `.custom-element-templates-${hash}.json`,
      url,
      enabled: source?.enabled !== false
    });
  }

  return { sources };
}

module.exports.resolveTemplateSources = resolveTemplateSources;

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
