'use strict';

var mapping = require('./implementation/Mapping');

var assign = require('lodash/object/assign');

module.exports = function(group, element, bpmnFactory, options) {

  group.entries = group.entries.concat(mapping(element, bpmnFactory, assign({}, options)));

};
