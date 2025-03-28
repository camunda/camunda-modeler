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

const { isCamunda8Form } = require('./util');

module.exports = {
  id: 'form',
  extensions: [ '.form' ],
  process: async (item) => {

    // handle empty file
    if (!item.file.contents) {
      return {
        type: 'form',
        forms: [],
        linkedIds: []
      };
    }

    if (!isCamunda8Form(item.file.contents)) {
      throw new Error('Not a Camunda 8 Form file');
    }

    let forms = [];

    try {
      const form = JSON.parse(item.file.contents);

      forms.push({
        id: form.id,
        name: form.name || form.id
      });

      assert(form.id, 'Form must have an id');
    } catch (error) {
      throw new Error(`Failed to parse form file: ${ error.message }`);
    }

    return {
      type: 'form',
      forms,
      linkedIds: []
    };
  }
};
