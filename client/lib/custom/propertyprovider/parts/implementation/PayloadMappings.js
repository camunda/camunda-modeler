'use strict';

var getBusinessObject = require('bpmn-js/lib/util/ModelUtil').getBusinessObject;

var elementHelper = require('bpmn-js-properties-panel/lib/helper/ElementHelper'),
  extensionElementsHelper = require('bpmn-js-properties-panel/lib/helper/ExtensionElementsHelper'),
  payloadMappingsHelper = require('../../helper/PayloadMappingsHelper'),
  cmdHelper = require('bpmn-js-properties-panel/lib/helper/CmdHelper');

var extensionElementsEntry = require('bpmn-js-properties-panel/lib/provider/camunda/parts/implementation/ExtensionElements');


function getPayloadMappings(element) {
  return payloadMappingsHelper.getPayloadMappings(element);
}

function getMappings(element) {
  return payloadMappingsHelper.getMappings(element);
}

function getMapping(element, idx) {
  return payloadMappingsHelper.getMapping(element, idx);
}

function createElement(type, parent, factory, properties) {
  return elementHelper.createElement(type, properties, parent, factory);
}

function createPayloadMappings(parent, bpmnFactory, properties) {
  return createElement('zeebe:PayloadMappings', parent, bpmnFactory, properties);
}

function createMapping(type, parent, bpmnFactory, properties) {
  return createElement(type, parent, bpmnFactory, properties);
}

function ensurePayloadMappingsSupported(element) {
  return payloadMappingsHelper.isPayloadMappingsSupported(element);
}

module.exports = function (element, bpmnFactory, options) {

  options = options || {};

  var idPrefix = options.idPrefix || '';

  var getSelected = function (element, node) {
    var selection = (inputEntry && inputEntry.getSelected(element, node)) || { idx: -1 };
    var parameter = getMapping(element, selection.idx);
    return parameter;
  };

  var result = {
    getSelectedMapping: getSelected
  };

  var entries = result.entries = [];

  if (!ensurePayloadMappingsSupported(element)) {
    return result;
  }

  var newElement = function (type, prop, factory) {

    return function (element, extensionElements, value) {
      var commands = [];

      var payloadMappings = getPayloadMappings(element);
      if (!payloadMappings) {
        var parent = extensionElements;
        payloadMappings = createPayloadMappings(parent, bpmnFactory, {
          mapping: []
        });

        commands.push(cmdHelper.addAndRemoveElementsFromList(
          element,
          extensionElements,
          'values',
          'extensionElements',
          [payloadMappings],
          []
        ));
      }

      var newElem = createMapping(type, payloadMappings, bpmnFactory, { source: 'sourceValue', target: 'targetValaue', type: 'PUT' });
      commands.push(cmdHelper.addElementsTolist(element, payloadMappings, prop, [newElem]));

      return commands;
    };
  };

  var removeElement = function (getter, prop) {
    return function (element, extensionElements, value, idx) {
      var payloadMappings = getPayloadMappings(element);
      var parameter = getter(element, idx);

      var commands = [];
      commands.push(cmdHelper.removeElementsFromList(element, payloadMappings, prop, null, [parameter]));

      var firstLength = payloadMappings.get(prop).length - 1;

      if (!firstLength) {

        commands.push(extensionElementsHelper.removeEntry(getBusinessObject(element), element, payloadMappings));
      }

      return commands;
    };
  };

  var setOptionLabelValue = function (getter) {
    return function (element, node, option, property, value, idx) {
      var parameter = getter(element, idx);

      option.text = value + ' : ' + parameter['target'];
    };
  };


  // input parameters ///////////////////////////////////////////////////////////////

  var inputEntry = extensionElementsEntry(element, bpmnFactory, {
    id: idPrefix + 'inputs',
    label: 'Input Parameters',
    modelProperty: 'source',
    prefix: 'Input',
    resizable: true,

    createExtensionElement: newElement('zeebe:Mapping', 'mapping'),
    removeExtensionElement: removeElement(getMapping, 'mapping'),

    getExtensionElements: function (element) {
      return getMappings(element);
    },

    setOptionLabelValue: setOptionLabelValue(getMapping)

  });
  entries.push(inputEntry);

  return result;

};
