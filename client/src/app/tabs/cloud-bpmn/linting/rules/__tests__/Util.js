/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import BpmnModdle from 'bpmn-moddle';

import {
  isFunction,
  isString
} from 'min-dash';

import { checkNode } from '../Util';

const moddle = new BpmnModdle();

export function expectSupported(checks) {
  return function(node) {
    return function() {
      if (isString(node)) {
        node = moddle.create(node);
      }

      if (isFunction(node)) {
        node = node();
      }

      expect(checkNode(node, checks)).to.be.true;
    };
  };
}

export function expectNotSupported(checks) {
  return function(node, type = false) {
    return function() {
      if (isString(node)) {
        node = moddle.create(node);
      }

      if (isFunction(node)) {
        node = node();
      }

      expect(checkNode(node, checks)).to.equal(type);
    };
  };
}

export async function parseDefinitions(xml) {
  const { rootElement } = await moddle.fromXML(xml);

  return rootElement;
}

export function withEventDefinition(type, eventDefinition) {
  return function() {
    const node = moddle.create(type);

    eventDefinition = moddle.create(eventDefinition);

    node.set('eventDefinitions', [ eventDefinition ]);

    eventDefinition.$parent = node;

    return node;
  };
}

export function withLoopCharacteristics(type, loopCharacteristics) {
  return function() {
    const node = moddle.create(type);

    loopCharacteristics = moddle.create(loopCharacteristics);

    node.set('loopCharacteristics', loopCharacteristics);

    loopCharacteristics.$parent = node;

    return node;
  };
}