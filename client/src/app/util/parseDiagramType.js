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

const TYPES = {
  bpmn: [ 'http://www.omg.org/spec/BPMN' ],
  dmn: [ 'http://www.omg.org/spec/DMN', 'https://www.omg.org/spec/DMN' ]
};


function getRootNamespace(xml) {
  let namespace;

  const parser = new Parser();

  parser.on('error', function() {
    parser.stop();
  });

  parser.on('openTag', function(elementName, attrGetter) {

    // bpmn:definitions
    // dmn:Definitions
    if (elementName.indexOf(':') !== -1) {
      const [ prefix, name ] = elementName.split(':');

      if (name.toLowerCase() === 'definitions') {
        namespace = attrGetter()[ `xmlns:${prefix}` ];
      }
    } else {

      // definitions
      // Definitions
      if (elementName.toLowerCase() === 'definitions') {
        namespace = attrGetter().xmlns;
      }
    }

    // only parse first tag
    parser.stop();
  });

  parser.parse(xml);

  return namespace;
}

/**
 * Try to infer a diagram type by parsing it.
 *
 * @param {string} contents
 *
 * @return {string|null} parsed type
 */
export default function parseDiagramType(contents = '') {
  const nsUri = getRootNamespace(contents);

  return nsUri && findIndex(TYPES, function(uris) {
    return uris.some(uri => nsUri.startsWith(uri));
  }) || null;
}
