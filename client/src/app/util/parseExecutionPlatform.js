/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

'use strict';

import {
  findIndex
} from 'min-dash';

import {
  Parser
} from 'saxen';

const MODELER_NAMESPACE = 'http://camunda.org/schema/modeler/1.0';

/**
 * Find execution platform details if available.
 *
 * @param {string} contents
 * @returns {null | { executionPlatform: string, executionPlatformVersion: string | null }}
 */
export default function parseExecutionPlatform(contents = '') {
  const executionPlatformDetails = getExecutionPlatformDetails(contents);

  return executionPlatformDetails;
}


function getExecutionPlatformDetails(xml) {
  let meta = null;

  const parser = new Parser();

  parser.on('error', function() {
    parser.stop();
  });

  parser.on('openTag', function(elementName, attrGetter) {

    // continue only if the first tag is definitions
    if (isDefinitions(elementName)) {
      const attrs = attrGetter();
      meta = getExecutionPlatformDetailsFromAttrs(attrs);
    }

    // only parse first tag
    parser.stop();
  });

  parser.parse(xml);

  return meta;
}

function isDefinitions(elementName) {
  let unwrappedName;

  // bpmn:definitions
  // dmn:Definitions
  if (elementName.indexOf(':') !== -1) {
    unwrappedName = elementName.split(':')[1];
  } else {

    // definitions
    // Definitions
    unwrappedName = elementName;
  }

  return unwrappedName.toLowerCase() === 'definitions';
}

function getExecutionPlatformDetailsFromAttrs(attrs) {

  const prefix = getModelerNamespacePrefix(attrs);

  // return null if namespace is missing
  if (prefix === null) {
    return null;
  }

  const executionPlatform = attrs[`${prefix}executionPlatform`];

  // do not check the version if the platform is missing
  if (!executionPlatform) {
    return null;
  }

  return {
    executionPlatform,
    executionPlatformVersion: attrs[`${prefix}executionPlatformVersion`] || null
  };
}

/**
 *
 * @param {object} attrs
 * @returns {null | '' | `${string}:`}
 */
function getModelerNamespacePrefix(attrs) {
  const wrappedPrefix = findIndex(attrs, MODELER_NAMESPACE);

  if (!wrappedPrefix) {
    return null;
  }

  if (wrappedPrefix === 'xmlns') {
    return '';
  }

  const [ _, prefix ] = wrappedPrefix.split(':');

  return `${prefix}:`;
}
