'use strict';

var payloadMappingsHelper = require('../../helper/PayloadMappingsHelper'),
    cmdHelper = require('bpmn-js-properties-panel/lib/helper/CmdHelper'),
    utils = require('bpmn-js-properties-panel/lib/Utils');

var entryFactory = require('bpmn-js-properties-panel/lib/factory/EntryFactory');

function ensurePayloadMappingsSupported(element) {
  return payloadMappingsHelper.isPayloadMappingsSupported(element);
}

module.exports = function(element, bpmnFactory, options) {

  options = options || {};

  var idPrefix        = options.idPrefix || '';

  var getSelected = options.getSelectedMapping;

  if (!ensurePayloadMappingsSupported(element)) {
    return [];
  }

  var entries = [];

  var isSelected = function(element, node) {
    return getSelected(element, node);
  };


  // parameter source ////////////////////////////////////////////////////////

  entries.push(entryFactory.validationAwareTextField({
    id: idPrefix + 'mappingSource',
    label: 'Source',
    modelProperty: 'source',

    getProperty: function(element, node) {
      return (getSelected(element, node) || {}).source;
    },

    setProperty: function(element, values, node) {
      var param = getSelected(element, node);
      return cmdHelper.updateBusinessObject(element, param, values);
    },

    validate: function(element, values, node) {
      var bo = getSelected(element, node);

      var validation = {};
      if (bo) {
        var sourceValue = values.source;

        if (sourceValue) {
          if (utils.containsSpace(sourceValue)) {
            validation.source = 'Source must not contain spaces';
          }
        }
        else {
          validation.source = 'Mapping must have a source';
        }
      }

      return validation;
    },

    disabled: function(element, node) {
      return !isSelected(element, node);
    }
  }));


// parameter target ////////////////////////////////////////////////////////

  entries.push(entryFactory.validationAwareTextField({
    id: idPrefix + 'mappingTarget',
    label: 'Target',
    modelProperty: 'target',

    getProperty: function(element, node) {
      return (getSelected(element, node) || {}).target;
    },

    setProperty: function(element, values, node) {
      var param = getSelected(element, node);
      return cmdHelper.updateBusinessObject(element, param, values);
    },

    validate: function(element, values, node) {
      var bo = getSelected(element, node);

      var validation = {};
      if (bo) {
        var targetValue = values.target;

        if (targetValue) {
          if (utils.containsSpace(targetValue)) {
            validation.target = 'Target must not contain spaces';
          }
        }
        else {
          validation.target = 'Mapping must have a Target';
        }
      }

      return validation;
    },

    disabled: function(element, node) {
      return !isSelected(element, node);
    }
  }));

  entries.push(entryFactory.selectBox({
    id: 'mapping-type',
    label: 'Type',
    selectOptions: [
      { name: 'PUT', value: 'PUT' },
      { name: 'COLLECT', value: 'COLLECT' }
    ],
    modelProperty: 'type',
    emptyParameter: false,

    get: function (element, node) {
      return (getSelected(element, node) || {});
    },

    set: function (element, values, node) {

      var param = getSelected(element, node);
      return cmdHelper.updateBusinessObject(element, param, values);
    }
  }));

  return entries;

};
