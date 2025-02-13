/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const assert = require('node:assert');

module.exports = {
  id: 'form',
  extensions: [ '.form' ],
  process: async (item) => {

    // handle empty file
    if (!item.file.contents) {
      return {
        type: 'form',
        ids: [],
        linkedIds: []
      };
    }

    let formId;

    try {
      const form = JSON.parse(item.file.contents);
      formId = form.id;

      assert(formId, 'Form must have an id');
    } catch (error) {
      throw new Error(`Failed to parse form file: ${ error.message }`);
    }

    return {
      type: 'form',
      ids: [ formId ],
      linkedIds: []
    };
  }
};
