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
  id: 'rpa',
  extensions: [ '.rpa' ],
  process: async (item) => {

    // handle empty file
    if (!item.file.contents) {
      return {
        type: 'rpa',
        scripts: [],
        linkedIds: []
      };
    }

    let scripts = [];

    try {
      const script = JSON.parse(item.file.contents);

      scripts.push({
        id: script.id,
        name: script.name || script.id
      });

      assert(script.id, 'RPA script must have an id');
    } catch (error) {
      throw new Error(`Failed to parse RPA script file: ${ error.message }`);
    }

    return {
      type: 'rpa',
      scripts,
      linkedIds: []
    };
  }
};
