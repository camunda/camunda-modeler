/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { filter } from 'min-dash';

import { is } from 'bpmn-js/lib/util/ModelUtil';


/**
 * Retrieve extensionElements from a given element
 *
 * @param {ModdleElement} element
 * @param {string} [type] - Optional type of extensionElements to be retrieved
 *
 * @return {Array.<ModdleElement>}
 */
export function getExtensionElements(element, type) {
  let elements = [];
  const extensionElements = element.get('extensionElements');

  if (typeof extensionElements !== 'undefined') {
    const extensionValues = extensionElements.get('values');

    if (typeof extensionValues !== 'undefined') {
      elements = filter(extensionValues, function(value) {
        return is(value, type);
      });
    }
  }

  return elements;
}
