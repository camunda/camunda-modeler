/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { ERROR_TYPES } from 'bpmnlint-plugin-camunda-compat/rules/utils/element';

import { is } from 'bpmnlint-utils';

import { isArray } from 'min-dash';

import { getTypeString } from './types';

function adjustErrorMessage(report, executionPlatformLabel) {
  const {
    error,
    message
  } = report;

  if (!error) {
    return report;
  }

  const { type } = error;

  if (type === ERROR_TYPES.ELEMENT_TYPE_NOT_ALLOWED) {
    return getElementTypeNotAllowedErrorMessage(report, executionPlatformLabel);
  }

  if (type === ERROR_TYPES.EXTENSION_ELEMENT_NOT_ALLOWED) {
    return getExtensionElementNotAllowedErrorMessage(report, executionPlatformLabel);
  }

  if (type === ERROR_TYPES.EXTENSION_ELEMENT_REQUIRED) {
    return getExtensionElementRequiredErrorMessage(report);
  }

  if (type === ERROR_TYPES.PROPERTY_DEPENDEND_REQUIRED) {
    return getPropertyDependendRequiredErrorMessage(report);
  }

  if (type === ERROR_TYPES.PROPERTY_REQUIRED) {
    return getPropertyRequiredErrorMessage(report, executionPlatformLabel);
  }

  if (type === ERROR_TYPES.PROPERTY_TYPE_NOT_ALLOWED) {
    return getPropertyTypeNotAllowedErrorMessage(report, executionPlatformLabel);
  }

  return message;
}

export function adjustErrorMessages(reports, executionPlatformLabel) {
  Object.values(reports).forEach(reportsForRule => {
    reportsForRule.forEach(report => {
      report.message = adjustErrorMessage(report, executionPlatformLabel);
    });
  });

  return reports;
}

function getIndefiniteArticle(type) {
  if ([
    'Error',
    'Escalation',
    'Event',
    'Intermediate',
    'Undefined'
  ].includes(type.split(' ')[ 0 ])) {
    return 'An';
  }

  return 'A';
}

function getElementTypeNotAllowedErrorMessage(report, executionPlatformLabel) {
  const { error } = report;

  const { node } = error;

  const typeString = getTypeString(node);

  return `${ getIndefiniteArticle(typeString) } <${ typeString }> is not supported by ${ executionPlatformLabel }`;
}

function getExtensionElementNotAllowedErrorMessage(report, executionPlatformLabel) {
  const {
    error,
    message
  } = report;

  const {
    node,
    extensionElement
  } = error;

  if (is(node, 'bpmn:BusinessRuleTask') && is(extensionElement, 'zeebe:CalledDecision')) {
    return `A <Business Rule Task> with <Implementation: DMN decision> is not supported by ${ executionPlatformLabel }`;
  }

  return message;
}

function getExtensionElementRequiredErrorMessage(report) {
  const {
    error,
    message
  } = report;

  const {
    node,
    requiredExtensionElement
  } = error;

  const typeString = getTypeString(node);

  if (requiredExtensionElement === 'zeebe:CalledElement') {
    return `${ getIndefiniteArticle(typeString) } <${ typeString }> must have a defined <Called element>`;
  }

  if (requiredExtensionElement === 'zeebe:LoopCharacteristics') {
    return `${ getIndefiniteArticle(typeString) } <${ typeString }> with <Multi-instance marker> must have a defined <Input collection>`;
  }

  if (requiredExtensionElement === 'zeebe:Subscription') {
    return `${ getIndefiniteArticle(typeString) } <${ typeString }> with <Message Reference> must have a defined <Subscription correlation key>`;
  }

  if (requiredExtensionElement === 'zeebe:TaskDefinition') {
    return `${ getIndefiniteArticle(typeString) } <${ typeString }> must have a <Task definition type>`;
  }

  if (isArray(requiredExtensionElement) && requiredExtensionElement.includes('zeebe:CalledDecision')) {
    return `${ getIndefiniteArticle(typeString) } <${ typeString }> must have a defined <Implementation>`;
  }

  return message;
}

function getPropertyDependendRequiredErrorMessage(report) {
  const {
    error,
    message
  } = report;

  const {
    node,
    parentNode,
    property,
    dependendRequiredProperty
  } = error;

  const typeString = getTypeString(parentNode || node);

  if (is(node, 'zeebe:LoopCharacteristics') && property === 'outputCollection' && dependendRequiredProperty === 'outputElement') {
    return `${ getIndefiniteArticle(typeString) } <${ typeString }> with <Multi-instance marker> and defined <Output collection> must have a defined <Output element>`;
  }

  if (is(node, 'zeebe:LoopCharacteristics') && property === 'outputElement' && dependendRequiredProperty === 'outputCollection') {
    return `${ getIndefiniteArticle(typeString) } <${ typeString }> with <Multi-instance marker> and defined <Output element> must have a defined <Output collection>`;
  }

  return message;
}

function getPropertyRequiredErrorMessage(report, executionPlatformLabel) {
  const {
    error,
    message
  } = report;

  const {
    node,
    parentNode,
    requiredProperty
  } = error;

  const typeString = getTypeString(parentNode || node);

  if (parentNode && is(parentNode, 'bpmn:BusinessRuleTask') && is(node, 'zeebe:CalledDecision') && requiredProperty === 'decisionId') {
    return 'A <Business Rule Task> with <Implementation: DMN decision> must have a defined <Called decision ID>';
  }

  if (parentNode && is(parentNode, 'bpmn:BusinessRuleTask') && is(node, 'zeebe:CalledDecision') && requiredProperty === 'resultVariable') {
    return 'A <Business Rule Task> with <Implementation: DMN decision> must have a defined <Result variable>';
  }

  if (parentNode && is(parentNode, 'bpmn:BusinessRuleTask') && is(node, 'zeebe:TaskDefinition') && requiredProperty === 'type') {
    return 'A <Business Rule Task> with <Implementation: Job worker> must have a defined <Task definition type>';
  }

  if (is(node, 'zeebe:CalledElement') && requiredProperty === 'processId') {
    return `${ getIndefiniteArticle(typeString) } <${ typeString }> must have a defined <Called element>`;
  }

  if (is(node, 'bpmn:Error') && requiredProperty === 'errorCode') {
    return `${ getIndefiniteArticle(typeString) } <${ typeString }> with <Error Reference> must have a defined <Error code>`;
  }

  if (is(node, 'bpmn:Event') && requiredProperty === 'eventDefinitions') {
    return `${ getIndefiniteArticle(typeString) } <${ typeString }> is not supported by ${ executionPlatformLabel }`;
  }

  if (is(node, 'zeebe:LoopCharacteristics') && requiredProperty === 'inputCollection') {
    return `${ getIndefiniteArticle(typeString) } <${ typeString }> with <Multi-instance marker> must have a defined <Input collection>`;
  }

  if (is(node, 'bpmn:Message') && requiredProperty === 'name') {
    return `${ getIndefiniteArticle(typeString) } <${ typeString }> with <Message Reference> must have a defined <Name>`;
  }

  if (is(node, 'zeebe:Subscription') && requiredProperty === 'correlationKey') {
    return `${ getIndefiniteArticle(typeString) } <${ typeString }> with <Message Reference> must have a defined <Subscription correlation key>`;
  }

  if (is(node, 'zeebe:TaskDefinition') && requiredProperty === 'type') {
    return `${ getIndefiniteArticle(typeString) } <${ typeString }> with <Implementation: Job worker> must have a defined <Task definition type>`;
  }

  if (requiredProperty === 'errorRef') {
    return `${ getIndefiniteArticle(typeString) } <${ typeString }> must have a defined <Error Reference>`;
  }

  if (requiredProperty === 'messageRef') {
    return `${ getIndefiniteArticle(typeString) } <${ typeString }> must have a defined <Message Reference>`;
  }

  return message;
}

function getPropertyTypeNotAllowedErrorMessage(report, executionPlatformLabel) {
  const {
    error,
    message
  } = report;

  const {
    node,
    parentNode,
    property
  } = error;

  const typeString = getTypeString(parentNode || node);

  if (is(node, 'bpmn:Event') && property === 'eventDefinitions') {
    return `${ getIndefiniteArticle(typeString) } <${ typeString }> is not supported by ${ executionPlatformLabel }`;
  }

  return message;
}