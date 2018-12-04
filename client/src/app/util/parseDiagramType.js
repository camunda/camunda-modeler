'use strict';

import {
  findIndex
} from 'min-dash';

import {
  Parser
} from 'saxen';

const TYPES = {
  bpmn: 'http://www.omg.org/spec/BPMN',
  dmn: 'http://www.omg.org/spec/DMN',
  cmmn: 'http://www.omg.org/spec/CMMN'
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
 * @param {String} contents
 *
 * @return {String|null} parsed type
 */
export default function parseFileType(contents) {
  const nsUri = getRootNamespace(contents);

  return nsUri && findIndex(TYPES, function(uri) {
    return nsUri.startsWith(uri);
  }) || null;
}