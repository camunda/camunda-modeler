'use strict';

var getBusinessObject = require('bpmn-js/lib/util/ModelUtil').getBusinessObject;

var elementHelper = require('bpmn-js-properties-panel/lib/helper/ElementHelper'),
    extensionElementsHelper = require('bpmn-js-properties-panel/lib/helper/ExtensionElementsHelper'),
    inputOutputHelper = require('../../helper/InputOutputHelper'),
    cmdHelper = require('bpmn-js-properties-panel/lib/helper/CmdHelper');

var extensionElementsEntry = require('bpmn-js-properties-panel/lib/provider/camunda/parts/implementation/ExtensionElements');


function getInputOutput(element) {
  return inputOutputHelper.getInputOutput(element);
}


function getInputParameters(element) {
  return inputOutputHelper.getInputParameters(element);
}

function getOutputParameters(element) {
  return inputOutputHelper.getOutputParameters(element);
}

function getInputParameter(element, idx) {
  return inputOutputHelper.getInputParameter(element, idx);
}

function getOutputParameter(element, idx) {
  return inputOutputHelper.getOutputParameter(element, idx);
}


function createElement(type, parent, factory, properties) {
  return elementHelper.createElement(type, properties, parent, factory);
}

function createInputOutput(parent, bpmnFactory, properties) {
  return createElement('zeebe:IoMapping', parent, bpmnFactory, properties);
}

function createParameter(type, parent, bpmnFactory, properties) {
  return createElement(type, parent, bpmnFactory, properties);
}


function ensureInputOutputSupported(element) {
  return inputOutputHelper.isInputOutputSupported(element);
}

function ensureOutparameterSupported(element) {
  return inputOutputHelper.areOutputParametersSupported(element);
}

module.exports = function(element, bpmnFactory, options) {

  options = options || {};

  var idPrefix        = options.idPrefix || '';

  var getSelected = function(element, node) {
    var selection = (inputEntry && inputEntry.getSelected(element, node)) || { idx: -1 };

    var parameter = getInputParameter(element, selection.idx);
    if (!parameter && outputEntry) {
      selection = outputEntry.getSelected(element, node);
      parameter = getOutputParameter(element, selection.idx);
    }
    return parameter;
  };

  var result = {
    getSelectedParameter: getSelected
  };

  var entries = result.entries = [];

  if (!ensureInputOutputSupported(element)) {
    return result;
  }

  var newElement = function(type, prop, factory) {

    return function(element, extensionElements, value) {
      var commands = [];

      var inputOutput = getInputOutput(element);
      if (!inputOutput) {
        var parent = extensionElements;
        inputOutput = createInputOutput(parent, bpmnFactory, {
          inputParameters: [],
          outputParameters: []
        });

        commands.push(cmdHelper.addAndRemoveElementsFromList(
          element,
          extensionElements,
          'values',
          'extensionElements',
          [ inputOutput ],
          []
        ));
      }

      var newElem = createParameter(type, inputOutput, bpmnFactory, { source: 'sourceValue', target: 'targetValaue' });
      commands.push(cmdHelper.addElementsTolist(element, inputOutput, prop, [ newElem ]));

      return commands;
    };
  };

  var removeElement = function(getter, prop, otherProp) {
    return function(element, extensionElements, value, idx) {
      var inputOutput = getInputOutput(element);
      var parameter = getter(element, idx);

      var commands = [];
      commands.push(cmdHelper.removeElementsFromList(element, inputOutput, prop, null, [ parameter ]));

      var firstLength = inputOutput.get(prop).length-1;
      var secondLength = (inputOutput.get(otherProp) || []).length;

      if (!firstLength && !secondLength) {

        commands.push(extensionElementsHelper.removeEntry(getBusinessObject(element), element, inputOutput));
      }

      return commands;
    };
  };

  var setOptionLabelValue = function(getter) {
    return function(element, node, option, property, value, idx) {
      var parameter = getter(element, idx);

      option.text = value +' : '+ parameter['target'];
    };
  };


  // input parameters ///////////////////////////////////////////////////////////////

  var inputEntry = extensionElementsEntry(element, bpmnFactory, {
    id: idPrefix + 'inputs',
    label: 'Input Parameters',
    modelProperty: 'source',
    prefix: 'Input',
    resizable: true,

    createExtensionElement: newElement('zeebe:Input', 'inputParameters'),
    removeExtensionElement: removeElement(getInputParameter, 'inputParameters', 'outputParameters'),

    getExtensionElements: function(element) {
      return getInputParameters(element);
    },

    onSelectionChange: function(element, node, event, scope) {
      outputEntry && outputEntry.deselect(element, node);
    },

    setOptionLabelValue: setOptionLabelValue(getInputParameter)

  });
  entries.push(inputEntry);


  // output parameters ///////////////////////////////////////////////////////

  if (ensureOutparameterSupported(element)) {
    var outputEntry = extensionElementsEntry(element, bpmnFactory, {
      id: idPrefix + 'outputs',
      label: 'Output Parameters',
      modelProperty: 'source',
      prefix: 'Output',
      resizable: true,

      createExtensionElement: newElement('zeebe:Output', 'outputParameters'),
      removeExtensionElement: removeElement(getOutputParameter, 'outputParameters', 'inputParameters'),

      getExtensionElements: function(element) {
        return getOutputParameters(element);
      },

      onSelectionChange: function(element, node, event, scope) {
        inputEntry.deselect(element, node);
      },

      setOptionLabelValue: setOptionLabelValue(getOutputParameter)

    });
    entries.push(outputEntry);
  }

  return result;

};
