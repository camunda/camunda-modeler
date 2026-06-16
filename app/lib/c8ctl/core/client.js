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
 * Camunda 8 SDK client factory.
 *
 * Ported from c8ctl `src/core/client.ts`. Builds a `CamundaClient` from the
 * `@camunda8/orchestration-cluster-api` library using a resolved cluster
 * config. The SDK constructor is injectable so tests can run without the real
 * library or network.
 */

/**
 * Maps a resolved cluster config to SDK options and creates a client.
 *
 * @param {object} clusterConfig resolved by `Config#resolveClusterConfig`
 * @param { {
 *   createCamundaClient?: Function
 * } } [deps]
 * @returns {object} CamundaClient
 */
function createClient(clusterConfig, deps = {}) {
  const createCamundaClient =
    deps.createCamundaClient ||
    require('@camunda8/orchestration-cluster-api').createCamundaClient;

  const sdkConfig = {
    CAMUNDA_REST_ADDRESS: clusterConfig.baseUrl
  };

  if (clusterConfig.clientId && clusterConfig.clientSecret) {
    sdkConfig.CAMUNDA_AUTH_STRATEGY = 'OAUTH';
    sdkConfig.CAMUNDA_CLIENT_ID = clusterConfig.clientId;
    sdkConfig.CAMUNDA_CLIENT_SECRET = clusterConfig.clientSecret;

    if (clusterConfig.audience) {
      sdkConfig.CAMUNDA_TOKEN_AUDIENCE = clusterConfig.audience;
    }

    if (clusterConfig.oAuthUrl) {
      sdkConfig.CAMUNDA_OAUTH_URL = clusterConfig.oAuthUrl;
    }
  } else if (clusterConfig.username && clusterConfig.password) {
    sdkConfig.CAMUNDA_AUTH_STRATEGY = 'BASIC';
    sdkConfig.CAMUNDA_BASIC_AUTH_USERNAME = clusterConfig.username;
    sdkConfig.CAMUNDA_BASIC_AUTH_PASSWORD = clusterConfig.password;
  } else {
    sdkConfig.CAMUNDA_AUTH_STRATEGY = 'NONE';
  }

  return createCamundaClient({ config: sdkConfig });
}

/**
 * Default page size for cursor-based pagination.
 */
const DEFAULT_PAGE_SIZE = 100;

/**
 * Default upper bound on total items fetched, guarding against runaway memory.
 */
const DEFAULT_MAX_ITEMS = 10000;

/**
 * Fetch all pages from a Camunda 8 search endpoint using cursor-based
 * pagination. Ported from c8ctl `fetchAllPages`.
 *
 * @param {Function} searchFn SDK search method, e.g. client.searchProcessInstances
 * @param {object} filter base filter; a `page` property is merged in
 * @param {number} [pageSize]
 * @param {number} [maxItems]
 * @returns {Promise<Array>}
 */
async function fetchAllPages(searchFn, filter, pageSize = DEFAULT_PAGE_SIZE, maxItems = DEFAULT_MAX_ITEMS) {
  const allItems = [];
  const seenCursors = new Set();
  const consistencyOpts = { consistency: { waitUpToMs: 0 } };

  let cursor;
  let fetching = true;

  while (fetching) {
    const pageFilter = {
      ...filter,
      page: {
        limit: pageSize,
        ...(cursor ? { after: cursor } : {})
      }
    };

    const result = await searchFn(pageFilter, consistencyOpts);

    if (result.items && result.items.length) {
      allItems.push(...result.items);
    }

    if (allItems.length >= maxItems) {
      allItems.length = maxItems;
      fetching = false;
      continue;
    }

    const endCursor = result.page && result.page.endCursor;
    const totalItems = Number(result.page && result.page.totalItems);

    if (!endCursor || seenCursors.has(endCursor)) {
      fetching = false;
      continue;
    }

    if (allItems.length >= totalItems) {
      fetching = false;
      continue;
    }

    if (!result.items || !result.items.length) {
      fetching = false;
      continue;
    }

    seenCursors.add(endCursor);
    cursor = endCursor;
  }

  return allItems;
}

module.exports = {
  createClient,
  fetchAllPages,
  DEFAULT_PAGE_SIZE,
  DEFAULT_MAX_ITEMS
};
