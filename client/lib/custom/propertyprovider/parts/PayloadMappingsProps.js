'use strict';

var payloadMappings = require('./implementation/PayloadMappings');

module.exports = function (group, element, bpmnFactory) {

  var payloadMappingsEntry = payloadMappings(element, bpmnFactory);
  group.entries = group.entries.concat(payloadMappingsEntry.entries);
  return {
    getSelectedMapping: payloadMappingsEntry.getSelectedMapping
  };

};
