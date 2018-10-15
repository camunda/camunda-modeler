'use strict';

var inputOutput = require('./implementation/InputOutput');

var elementHelper = require('bpmn-js-properties-panel/lib/helper/ElementHelper'),
  cmdHelper = require('bpmn-js-properties-panel/lib/helper/CmdHelper'),
  inputOutputHelper = require('../helper/InputOutputHelper');

var entryFactory = require('bpmn-js-properties-panel/lib/factory/EntryFactory');

var extensionElementsHelper = require('bpmn-js-properties-panel/lib/helper/ExtensionElementsHelper');
var getBusinessObject = require('bpmn-js/lib/util/ModelUtil').getBusinessObject;

module.exports = function (group, element, bpmnFactory) {


  function getIoMapping(element) {
    var bo = getBusinessObject(element);
    return (getElements(bo, 'zeebe:IoMapping') || [])[0];
  }

  function getElements(bo, type, prop) {
    var elems = extensionElementsHelper.getExtensionElements(bo, type) || [];
    return !prop ? elems : (elems[0] || {})[prop] || [];
  }

  function ensureInputOutputSupported(element) {
    return inputOutputHelper.isInputOutputSupported(element);
  }

  if (ensureInputOutputSupported(element)) {


    group.entries.push(entryFactory.selectBox({
      id: 'io-mapping-outputBehavior',
      label: 'Output Behavior',
      selectOptions: [
        { name: '', value: '' },
        { name: 'MERGE', value: 'merge' },
        { name: 'OVERWRITE', value: 'overwrite' },
        { name: 'NONE', value: 'none' }
      ],
      modelProperty: 'outputBehavior',
      emptyParameter: false,

      get: function (element, node) {
        return (getIoMapping(element, node) || {});
      },

      set: function (element, values, node) {
        var bo = getBusinessObject(element);
        var commands = [];

        //CREATE extensionElemente
        var extensionElements = bo.get('extensionElements');
        if (!extensionElements) {
          extensionElements = elementHelper.createElement('bpmn:ExtensionElements', { values: [] }, bo, bpmnFactory);
          commands.push(cmdHelper.updateProperties(element, { extensionElements: extensionElements }));
        }
        //create taskDefinition
        var ioMapping = getIoMapping(element);

        if (!ioMapping) {
          ioMapping = elementHelper.createElement('zeebe:IoMapping', {}, extensionElements, bpmnFactory);
          commands.push(cmdHelper.addAndRemoveElementsFromList(
            element,
            extensionElements,
            'values',
            'extensionElements',
            [ioMapping],
            []
          ));
        }

        commands.push(cmdHelper.updateBusinessObject(element, ioMapping, values));
        return commands;
      }
    }));
  }

  var inputOutputEntry = inputOutput(element, bpmnFactory);
  group.entries = group.entries.concat(inputOutputEntry.entries);
  return {
    getSelectedParameter: inputOutputEntry.getSelectedParameter
  };

};
