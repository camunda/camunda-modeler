'use strict';

var forEach = require('lodash/collection/forEach');

var IDENTIFIERS = [
  {
    type: 'bpmn',
    identifier: 'http://www.omg.org/spec/BPMN'
  },
  {
    type: 'dmn',
    identifier: 'http://www.omg.org/spec/DMN'
  }
];

function extractNotation(file) {
  var notation = null;

  forEach(IDENTIFIERS, function(elem) {
    if (file.indexOf(elem.identifier) !== -1) {
      notation = elem.type;
    }
  });

  return notation;
}

module.exports.extractNotation = extractNotation;


function hasExtension(filePath) {
  return filePath && /\.(\w)+$/.test(filePath);
}

module.exports.hasExtension = hasExtension;
