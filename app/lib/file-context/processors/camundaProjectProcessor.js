/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const { resolveProjectResources } = require('../project-resources');

module.exports = {
  id: 'camundaProject',
  extensions: [ '.process-application' ],
  fileNames: [ 'camunda.json' ],
  process: async (item) => {
    const { file } = item;

    return {
      type: 'camundaProject',
      resources: resolveProjectResources(file.path, {
        contents: typeof file.contents === 'string' ? file.contents : undefined
      })
    };
  }
};
