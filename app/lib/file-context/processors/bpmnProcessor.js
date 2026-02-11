/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const { BpmnModdle } = require('bpmn-moddle');

const zeebe = require('zeebe-bpmn-moddle/resources/zeebe');

const moddle = new BpmnModdle({ zeebe });

const {
  findExtensionElement,
  is,
  isCamunda8BPMN,
  traverse
} = require('./util');

module.exports = {
  id: 'bpmn',
  extensions: [ '.bpmn' ],
  process: async (item) => {

    // handle empty file
    if (!item.file.contents) {
      return {
        type: 'bpmn',
        processes: [],
        linkedIds: []
      };
    }

    if (!isCamunda8BPMN(item.file.contents)) {
      throw new Error('Not a Camunda 8 BPMN file');
    }

    let rootElement, processes, linkedIds;

    try {
      ({ rootElement } = await moddle.fromXML(item.file.contents));

      processes = findProcesses(rootElement);
      linkedIds = [
        ...findLinkedProcessIds(rootElement),
        ...findLinkedDecisionIds(rootElement),
        ...findLinkedFormIds(rootElement)
      ];
    } catch (error) {
      throw new Error(`Failed to parse BPMN file: ${ error.message }`);
    }

    return {
      type: 'bpmn',
      processes,
      linkedIds
    };
  }
};

function findProcesses(definitions) {
  const processes = [];

  traverse(definitions, {
    enter(element) {
      if (is(element, 'bpmn:Process')) {
        processes.push({
          id: element.get('id'),
          name: element.get('name') || element.get('id')
        });
      }
    }
  });

  return processes;
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
