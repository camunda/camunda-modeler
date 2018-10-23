'use strict';

import {
  findIndex
} from 'min-dash';

import {
  Parser
} from 'saxen';

var TYPES = {
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
      // Defintitions
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

function parseType(file) {
  let type = null;

  const nsUri = getRootNamespace(file.contents);

  if (nsUri) {
    type = findIndex(TYPES, function(uri) {
      return nsUri.startsWith(uri);
    });


  }

  return type;
}

module.exports = parseType;