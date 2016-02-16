'use strict';

var forEach = require('lodash/collection/forEach');

var TYPES = {
  bpmn: 'http://www.omg.org/spec/BPMN',
  dmn: 'http://www.omg.org/spec/DMN'
};


module.exports = function parseType(file) {

  var type;

  forEach(TYPES, function(ns, t) {
    if (file.contents.indexOf(ns) !== -1) {
      type = t;
    }
  });

  return type;
};