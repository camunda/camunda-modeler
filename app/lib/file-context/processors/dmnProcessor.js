/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const DmnModdle = require('dmn-moddle');

const moddle = new DmnModdle();

const {
  is,
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
        ids: [],
        linkedIds: []
      };
    }

    let rootElement, ids;

    try {
      ({ rootElement } = await moddle.fromXML(item.file.contents));

      ids = findDecisionIds(rootElement);
    } catch (error) {
      throw new Error(`Failed to parse DMN file: ${ error.message }`);
    };

    return {
      type: 'dmn',
      ids,
      linkedIds: []
    };
  }
};

function findDecisionIds(definitions) {
  const decisionIds = [];

  traverse(definitions, {
    enter(element) {
      if (is(element, 'dmn:Decision')) {
        decisionIds.push(element.get('id'));
      }
    }
  });

  return decisionIds;
}