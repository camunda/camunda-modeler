/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

module.exports = async function(context) {

  const handlers = [
    require('./after-all-artifact-build/build-mac-zip')
  ];

  let result = [];

  for (const handler of handlers) {
    const additionalArtifacts = await handler(context);

    if (additionalArtifacts) {
      result = result.concat(...additionalArtifacts);
    }
  }

  return result;
};
