/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

function getEventDefinition(node) {
  const eventDefinitions = node.get('eventDefinitions');

  return eventDefinitions && eventDefinitions[ 0 ];
}

function getEventDefinitionPrefix(eventDefinition) {
  const localType = getLocalType(eventDefinition);

  return localType.replace('EventDefinition', '');
}

function getLocalType(node) {
  const { $descriptor } = node;

  const { localName } = $descriptor.ns;

  return localName;
}

function formatTypeString(string) {
  return string.replace(/([a-z])([A-Z])/g, '$1 $2').trim();
}

export function getTypeString(node) {
  let type = getLocalType(node);

  const eventDefinition = getEventDefinition(node);

  if (eventDefinition) {
    type = `${ getEventDefinitionPrefix(eventDefinition) }${ type }`;
  } else if ([
    'BoundaryEvent',
    'EndEvent',
    'IntermediateCatchEvent',
    'IntermediateThrowEvent',
    'StartEvent'
  ].includes(type)) {
    type = `Undefined ${ type }`;
  }

  if (type === 'Task') {
    type = 'Undefined Task';
  }

  return formatTypeString(type);
}