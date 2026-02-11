/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const { DmnModdle } = require('dmn-moddle');

const moddle = new DmnModdle();

const {
  is,
  isCamunda8DMN,
  traverse
} = require('./util');

module.exports = {
  id: 'dmn',
  extensions: [ '.dmn' ],
  process: async (item) => {

    // handle empty file
    if (!item.file.contents) {
      return {
        type: 'dmn',
        decisions: [],
        linkedIds: []
      };
    }

    if (!isCamunda8DMN(item.file.contents)) {
      throw new Error('Not a Camunda 8 DMN file');
    }

    let rootElement, decisions;

    try {
      ({ rootElement } = await moddle.fromXML(item.file.contents));

      decisions = findDecisions(rootElement);
    } catch (error) {
      throw new Error(`Failed to parse DMN file: ${ error.message }`);
    };

    return {
      type: 'dmn',
      decisions,
      linkedIds: []
    };
  }
};

function findDecisions(definitions) {
  const decisions = [];

  traverse(definitions, {
    enter(element) {
      if (is(element, 'dmn:Decision')) {
        decisions.push({
          id: element.get('id'),
          name: element.get('name') || element.get('id')
        });
      }
    }
  });

  return decisions;
}
