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

module.exports = {
  id: 'camundaProject',
  extensions: [ '.process-application' ],
  fileNames: [ 'camunda.json' ],
  process: async (item) => {
    return {
      type: 'camundaProject',

      // read from disk rather than the indexed contents, to fail on read
      // errors and to decode byte order marks
      resources: resolve(item.file.path)
    };
  }
};

/**
 * @param { string } projectFilePath
 *
 * @return { import('../project-resources').ProjectResources }
 */
function resolve(projectFilePath) {
  try {
    return resolveProjectResources(projectFilePath);
  } catch (error) {

    // never lose the project to an unexpected error, report it instead
    return {
      mode: MODE_C8IGNORE,
      selected: [],
      error: `Failed to resolve project resources: ${ error.message }`,
      errorType: ERROR_INVALID_CONFIG
    };
  }
}
