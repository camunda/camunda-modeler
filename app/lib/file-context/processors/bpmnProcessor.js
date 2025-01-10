/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const BpmnModdle = require('bpmn-moddle');

const zeebe = require('zeebe-bpmn-moddle/resources/zeebe');

const moddle = new BpmnModdle({ zeebe });

const {
  findExtensionElement,
  is,
  traverse
} = require('./util');

module.exports = {
  extensions: [ '.bpmn', '.xml' ],
  process: async (item) => {
    let rootElement, ids, linkedIds;

    try {
      ({ rootElement } = await moddle.fromXML(item.file.contents));

      ids = findProcessIds(rootElement);
      linkedIds = [
        ...findLinkedProcessIds(rootElement),
        ...findLinkedDecisionIds(rootElement),
        ...findLinkedFormIds(rootElement)
      ];
    } catch (error) {
      return {
        type: 'bpmn',
        error: error.message,
        ids: [],
        linkedIds: []
      };
    };

    return {
      type: 'bpmn',
      ids,
      linkedIds
    };
  }
};

function findProcessIds(definitions) {
  const processIds = [];

  traverse(definitions, {
    enter(element) {
      if (is(element, 'bpmn:Process')) {
        processIds.push(element.get('id'));
      }
    }
  });

  return processIds;
}

/**
 * @param {Object} definitions
 * @param {string} type
 * @param {string} elementType
 * @param {string} extensionElementType
 * @param {string} propertyName
 *
 * @returns { {
 *   type: string,
 *   elementId: string,
 *   linkedId: string
 * }[] }
 */
function findLinkedIds(definitions, type, elementType, extensionElementType, propertyName) {
  const linkedIds = [];

  traverse(definitions, {
    enter(element) {
      if (is(element, elementType)) {
        const extensionElement = findExtensionElement(element, extensionElementType);

        if (extensionElement) {
          const property = extensionElement.get(propertyName);

          if (property && property.length) {
            linkedIds.push({
              type,
              elementId: element.get('id'),
              linkedId: property
            });
          }
        }

      }
    }
  });

  return linkedIds;
}

function findLinkedProcessIds(definitions) {
  return findLinkedIds(definitions, 'bpmn', 'bpmn:CallActivity', 'zeebe:CalledElement', 'processId');
}

function findLinkedDecisionIds(definitions) {
  return findLinkedIds(definitions, 'dmn', 'bpmn:BusinessRuleTask', 'zeebe:CalledDecision', 'decisionId');
}

function findLinkedFormIds(definitions) {
  return findLinkedIds(definitions, 'form', 'bpmn:UserTask', 'zeebe:FormDefinition', 'formId');
}