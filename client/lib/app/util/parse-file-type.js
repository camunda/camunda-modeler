'use strict';

import {
  forEach
} from 'min-dash';

import {
  Parser
} from 'saxen';

var TYPES = {
  bpmn: 'http://www.omg.org/spec/BPMN',
  dmn: 'http://www.omg.org/spec/DMN',
  cmmn: 'http://www.omg.org/spec/CMMN'
};


module.exports = function parseType(file) {
  var contents = file.contents,
      type = null,
      namespace;

  const parser = new Parser();

  parser.on('openTag', function(elementName, attrGetter) {

    // bpmn:definitions
    // dmn:Definitions
    if (elementName.indexOf(':') !== -1) {
      let [ prefix, name ] = elementName.split(':');

      if (name.toLowerCase() === 'definitions') {
        namespace = attrGetter()[ `xmlns:${prefix}` ];
      }
    }

    // definitions
    // Defintitions
    if (elementName.toLowerCase() === 'definitions') {
      namespace = attrGetter().xmlns;
    }

    // only parse first tag
    parser.stop();
  });

  try {
    parser.parse(contents);

    forEach(TYPES, function(uri, t) {
      if (namespace && namespace.indexOf(uri) !== -1) {
        type = t;
      }
    });
  } catch (err) {
    console.log(err);
  }

  return type;
};
