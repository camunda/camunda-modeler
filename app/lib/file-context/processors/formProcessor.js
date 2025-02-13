/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

module.exports = {
  extensions: [ '.form' ],
  process: async (item) => {
    let form;

    try {
      form = JSON.parse(item.file.contents);
    } catch (error) {
      return {
        type: 'form',
        error: error.message,
        ids: []
      };
    }

    return {
      type: 'form',
      ids: [ form.id ]
    };
  }
};