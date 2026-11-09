/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const {
  ERROR_INVALID_CONFIG,
  MODE_C8IGNORE,
  resolveProjectResources
} = require('../project-resources');

/**
 * Resolutions in progress by project file; a newer one supersedes (aborts) an older one.
 *
 * @type { Map<string, AbortController> }
 */
const resolutions = new Map();

module.exports = {
  id: 'camundaProject',
  extensions: [ '.process-application' ],
  fileNames: [ 'camunda.json' ],
  process: async (item) => {
    return {
      type: 'camundaProject',

      // read from disk rather than the indexed contents, to fail on read
      // errors and to decode byte order marks
      resources: await resolve(item.file.path)
    };
  }
};

/**
 * @param { string } projectFilePath
 *
 * @return { Promise<import('../project-resources').ProjectResources> }
 *
 * @throws if superseded by a newer resolution of the same project
 */
async function resolve(projectFilePath) {
  const previous = resolutions.get(projectFilePath);

  if (previous) {
    previous.abort();
  }

  const controller = new AbortController();

  resolutions.set(projectFilePath, controller);

  try {
    return await resolveProjectResources(projectFilePath, { signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) {
      throw error;
    }

    // never lose the project to an unexpected error, report it instead
    return {
      mode: MODE_C8IGNORE,
      selected: [],
      error: `Failed to resolve project resources: ${ error.message }`,
      errorType: ERROR_INVALID_CONFIG
    };
  } finally {
    if (resolutions.get(projectFilePath) === controller) {
      resolutions.delete(projectFilePath);
    }
  }
}
