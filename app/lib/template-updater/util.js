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
 * @typedef {import('./types').Template} Template
 * @typedef {import('./types').TemplateMetadata} TemplateMetadata
 * @typedef {import('./types').TemplatesByIdMetadata} TemplatesByIdMetadata
 * @typedef {import('./types').TemplateUpdateResult} TemplateUpdateResult
 */

const fs = require('fs');
const path = require('path');
const fetch = require('electron').net.fetch;

const semver = require('semver');

const log = require('../log')('app:template-updater:util');

function getTemplatesPath(userPath, fileName) {
  return path.join(userPath, 'resources/element-templates', fileName);
}

module.exports.getTemplatesPath = getTemplatesPath;

/**
 * Update templates for a specific execution platform and version.
 *
 * @param {Endpoint} endpoint
 * @param {string} executionPlatformVersion
 * @param {string} userPath
 *
 * @returns {Promise<TemplateUpdateResult>}
 */
async function updateTemplates(endpoint, executionPlatformVersion, userPath) {
  const {
    url,
    fileName
  } = endpoint;

  log.info(`Updating templates from ${ url } for execution platform version ${ executionPlatformVersion }`);

  try {
    const templatesPath = getTemplatesPath(userPath, fileName);

    const hasTemplates = fs.existsSync(templatesPath);

    /** @type {Template[]} */
    let templates = [];

    if (hasTemplates) {
      try {
        templates = JSON.parse(fs.readFileSync(templatesPath));

        if (!Array.isArray(templates)) {
          templates = [];
        }
      } catch (error) {
        log.warn('Failed to parse templates', error);
      }
    }

    const {
      updatedTemplates,
      warnings
    } = await fetchAndUpdateTemplates(templates, executionPlatformVersion, url);

    fs.mkdirSync(path.dirname(templatesPath), { recursive: true });

    fs.writeFileSync(templatesPath, JSON.stringify(updatedTemplates, null, 2));

    return { warnings, hasNew: updatedTemplates.length !== templates.length };
  } catch (error) {
    log.error(`Failed to update templates from ${ url }`, error);

    return {
      warnings: [ `Failed to update templates from ${ url }: ${ error.message }` ],
      hasNew: false
    };
  }
}

module.exports.updateTemplates = updateTemplates;

/**
 * Fetch templates compatible with the execution platform version from URL. Skip
 * templates that cannot be fetched or parsed without errors.
 *
 * @param {Template[]} templates
 * @param {string} executionPlatformVersion
 * @param {string} url
 *
 * @returns {Promise<{ updatedTemplates: Template[], warnings: string[] }>}
 */
async function fetchAndUpdateTemplates(templates, executionPlatformVersion, url) {
  log.info('Fetching and updating templates');

  let updatedTemplates = [ ...templates ],
      warnings = [];

  let response = await fetch(url);

  if (!response.ok) {
    log.warn(`Failed to fetch templates from ${ url } (HTTP ${ response.status })`);

    warnings.push(`Failed to fetch templates from ${ url } (HTTP ${ response.status })`);

    return { updatedTemplates, warnings };
  }

  /** @type {TemplatesByIdMetadata} */
  const templatesByIdMetadata = await response.json();

  const stats = {
    fetched: 0,
    cached: 0,
    incompatible: 0,
    error: 0
  };

  for (const id in templatesByIdMetadata) {
    const templatesMetadata = templatesByIdMetadata[ id ];

    for (const templateMetadata of templatesMetadata) {
      const template = updatedTemplates.find(t => t.id === id && t.version === templateMetadata.version);

      if (template && isCachedRef(template, templateMetadata)) {
        log.info(`Skipping template ${ id } version ${ templateMetadata.version } as it was already fetched from ${ templateMetadata.ref }`);

        stats.cached++;

        continue;
      }

      if (!isTemplateCompatible(templateMetadata, executionPlatformVersion)) {
        log.info(`Skipping template ${ id } version ${ templateMetadata.version } as it is not compatible with execution platform version ${ executionPlatformVersion }`);

        stats.incompatible++;

        continue;
      }

      const { ref } = templateMetadata;

      response = await fetch(ref);

      if (!response.ok) {
        log.warn(`Failed to fetch template ${ id } version ${ templateMetadata.version } from ${ ref } (HTTP ${ response.status })`);

        stats.error++;

        warnings.push(`Failed to fetch template ${ id } version ${ templateMetadata.version } from ${ ref } (HTTP ${ response.status })`);

        continue;
      }

      const templateText = await response.text();

      try {
        let templateJson = JSON.parse(templateText);

        templateJson = cacheRef(templateJson, templateMetadata);

        const existingIndex = updatedTemplates.findIndex(t => t.id === templateJson.id && t.version === templateJson.version);

        if (existingIndex !== -1) {
          updatedTemplates[existingIndex] = templateJson;
        } else {
          updatedTemplates.push(templateJson);
        }

        stats.fetched++;

        log.info(`Fetched template ${ id } version ${ templateMetadata.version } from ${ ref }`);
      } catch (error) {
        log.warn(`Failed to parse template ${ id } version ${ templateMetadata.version } fetched from ${ ref }`, error);

        stats.error++;

        warnings.push(`Failed to parse template ${ id } version ${ templateMetadata.version } fetched from ${ ref }: ${ error.message }`);
      }
    }
  }

  log.info(`Fetched ${ stats.fetched } templates from ${ url }, cached: ${ stats.cached }, incompatible: ${ stats.incompatible }, warnings: ${ warnings.length }, error: ${ stats.error }`);

  return { updatedTemplates, warnings };
}

function isTemplateCompatible(templateMetadata, executionPlatformVersion) {
  const { engine } = templateMetadata;

  if (!engine) {
    log.info(`Template ${ templateMetadata.ref } is compatible with execution platform version ${ executionPlatformVersion } (no engine specified)`);

    return true;
  }

  if (engine[ 'camunda' ] && !semver.satisfies(semver.coerce(executionPlatformVersion), engine[ 'camunda' ])) {
    log.info(`Template ${ templateMetadata.ref } is not compatible with execution platform version ${ executionPlatformVersion } (camunda: ${ engine[ 'camunda' ] })`);

    return false;
  }

  log.info(`Template ${ templateMetadata.ref } is compatible with execution platform version ${ executionPlatformVersion } (engine: ${ JSON.stringify(engine) })`);

  return true;
}

module.exports.isTemplateCompatible = isTemplateCompatible;

/**
 * Check if the reference of a template is cached.
 *
 * @param {Template} template - Existing template
 * @param {TemplateMetadata} templateMetadata - Metadata of the template to be fetched
 *
 * @return {boolean}
 */
function isCachedRef(template, templateMetadata) {
  const { ref } = templateMetadata;

  return template.metadata?.upstreamRef === ref;
}

module.exports.isCachedRef = isCachedRef;

/**
 * Cache the reference of a template.
 *
 * @param {Template} template - Template to cache
 * @param {TemplateMetadata} templateMetadata - Metadata of the template to be cached
 *
 * @return {Template}
 */
function cacheRef(template, templateMetadata) {
  const { ref } = templateMetadata;

  if (!template.metadata) {
    template.metadata = {};
  }

  template.metadata.upstreamRef = ref;

  return template;
}

module.exports.cacheRef = cacheRef;
