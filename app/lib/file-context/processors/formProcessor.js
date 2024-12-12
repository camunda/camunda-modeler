/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const { findFileInParentDirectories } = require('./util');

module.exports = {
  extensions: [ '.form' ],
  process: async (item) => {
    const processApplicationFilePath = findFileInParentDirectories(item.file.path, '.process-application');

    const form = JSON.parse(item.file.contents);

    return {
      type: 'form',
      ids: [ form.id ],
      processApplication: processApplicationFilePath
    };
  }
};