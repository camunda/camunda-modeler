/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/*
 * @typedef { {
 *   id: string,
 *   version?: number;
 * } } Template
 */

const fs = require('fs');
const path = require('path');

const MARKET_PLACE_API_URL = 'https://marketplace.cloud.camunda.io/api/v1';

const log = require('../log')('app:connector-templates');

const connectorTemplatesFileName = '.camunda-connector-templates.json';

function getConnectorTemplatesPath(userPath) {
  return path.join(userPath, 'resources/element-templates', connectorTemplatesFileName);
}

module.exports.getConnectorTemplatesPath = getConnectorTemplatesPath;

async function updateConnectorTemplates(renderer, userPath) {

  const t = Date.now();

  log.info('Starting update');

  try {
    const connectorTemplatesPath = getConnectorTemplatesPath(userPath);

    const hasConnectorTemplates = fs.existsSync(connectorTemplatesPath);

    let connectorTemplates = [];

    if (hasConnectorTemplates) {
      try {
        connectorTemplates = JSON.parse(fs.readFileSync(connectorTemplatesPath));

        if (!Array.isArray(connectorTemplates)) {
          connectorTemplates = [];
        }
      } catch (error) {
        log.warn('Failed to parse connector templates', error);
      }
    }

    const { latestConnectorTemplates, warnings } = await fetchLatestConnectorTemplates();

    const {
      connectorTemplates: mergedConnectorTemplates,
      added
    } = mergeConnectorTemplates(connectorTemplates, latestConnectorTemplates);

    fs.mkdirSync(path.dirname(connectorTemplatesPath), { recursive: true });

    fs.writeFileSync(connectorTemplatesPath, JSON.stringify(mergedConnectorTemplates, null, 2));

    renderer.send('client:connector-templates-update-success', added > 0, warnings);
  } catch (error) {
    renderer.send('client:connector-templates-update-error', error.message);
  }

  log.info('Update done in %sms', Date.now() - t);
}

module.exports.updateConnectorTemplates = updateConnectorTemplates;

/**
 * Fetch latest connector templates created by Camunda through marketplace API.
 * Skip connector templates that cannot be fetched or parsed without errors.
 *
 * @returns {Promise<Template[]>}
 */
async function fetchLatestConnectorTemplates() {
  log.info('Fetching latest templates');

  let response = await fetch(`${ MARKET_PLACE_API_URL }/connectors?creatorType=camunda`);

  if (!response.ok) {
    log.warn('Failed to fetch templates (HTTP %s)', response.status);

    throw new Error('Failed to fetch templates');
  }

  const { items } = await response.json();

  const latestConnectorTemplates = [],
        warnings = [];

  for (const item of items) {
    response = await fetch(`${ MARKET_PLACE_API_URL }/connectors/${ item.id }`);

    if (!response.ok) {
      log.warn('Failed to fetch template', item.name);

      warnings.push(`Unable to fetch template ${ item.name }`);

      continue;
    }

    const { templates } = await response.json();

    for (const template of templates) {
      response = await fetch(template.url);

      if (!response.ok) {
        log.warn('Failed to fetch template', item.name);

        warnings.push(`Unable to fetch template ${ item.name }`);

        continue;
      }

      const templateText = await response.text();

      try {
        const templateJson = JSON.parse(templateText);

        latestConnectorTemplates.push(templateJson);

        log.info('Fetched template', templateJson.id);
      } catch (error) {
        log.warn('Failed to fetch template', item.name);

        warnings.push(`Unable to fetch template ${ item.name }`);

        continue;
      }
    }
  }

  log.info('Fetched latest templates');

  return { latestConnectorTemplates, warnings };
}

/**
 * Merge latest connector templates with existing. If connector template with
 * same ID and version exists, it will be replaced by latest. Otherwise, latest
 * will be added. No connector templates will be removed.
 *
 * @param {Template[]} connectorTemplates
 * @param {Template[]} latestConnectorTemplates
 *
 * @returns {Template[]}
 */
function mergeConnectorTemplates(connectorTemplates, latestConnectorTemplates) {
  let added = 0,
      replaced = 0;

  const mergedConnectorTemplates = [ ...connectorTemplates ];

  for (const latestConnectorTemplate of latestConnectorTemplates) {
    const index = mergedConnectorTemplates.findIndex((connectorTemplate) => {
      return connectorTemplate.id === latestConnectorTemplate.id
        && connectorTemplate.version === latestConnectorTemplate.version;
    });

    if (index !== -1) {
      mergedConnectorTemplates[ index ] = latestConnectorTemplate;

      replaced++;

      log.info('Replaced template', latestConnectorTemplate.id);
    } else {
      mergedConnectorTemplates.push(latestConnectorTemplate);

      added++;

      log.info('Added template', latestConnectorTemplate.id);
    }
  }

  return {
    connectorTemplates: mergedConnectorTemplates,
    added,
    replaced
  };
}

const ONE_DAY_MS = 1000 * 60 * 60 * 24;

/**
 * @param {import('../util/renderer') } renderer
 * @param {string} userPath
 */
function registerConnectorTemplateUpdater(renderer, userPath) {

  let shouldUpdate = true;

  setInterval(() => {
    shouldUpdate = true;
  }, ONE_DAY_MS);

  const handleTabChange = (newActive) => {

    if (newActive?.type === 'cloud-bpmn' && shouldUpdate) {
      shouldUpdate = false;

      updateConnectorTemplates(renderer, userPath);
    }
  };

  renderer.on('activeTab:change', handleTabChange);
}

module.exports.registerConnectorTemplateUpdater = registerConnectorTemplateUpdater;
