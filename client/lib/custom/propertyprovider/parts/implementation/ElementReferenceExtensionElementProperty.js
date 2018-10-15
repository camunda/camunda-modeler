'use strict';

var entryFactory = require('bpmn-js-properties-panel/lib/factory/EntryFactory');

var cmdHelper = require('bpmn-js-properties-panel/lib/helper/CmdHelper'),
elementHelper = require('bpmn-js-properties-panel/lib/helper/ElementHelper');

var extensionElementsHelper = require('bpmn-js-properties-panel/lib/helper/ExtensionElementsHelper');

var getBusinessObject = require('bpmn-js/lib/util/ModelUtil').getBusinessObject;

/**
 * Create an entry to modify a property of an element which
 * is referenced by a event definition.
 *
 * @param  {djs.model.Base} element
 * @param  {ModdleElement} definition
 * @param  {BpmnFactory} bpmnFactory
 * @param  {Object} options
 * @param  {string} options.id the id of the entry
 * @param  {string} options.label the label of the entry
 * @param  {string} options.referenceProperty the name of referencing property
 * @param  {string} options.modelProperty the name of property to modify
 * @param  {string} options.extensionElement the name of the extensionElement to modify
 * @param  {string} options.shouldValidate a flag indicate whether to validate or not
 *
 * @return {Array<Object>} return an array containing the entries
 */
module.exports = function(element, definition, bpmnFactory, options) {

  var id = options.id || 'element-property';
  var label = options.label;
  var referenceProperty = options.referenceProperty;
  var modelProperty = options.modelProperty || 'name';
  var extensionElementKey = options.extensionElement || 'zeebe:Subscription';
  var shouldValidate = options.shouldValidate || false;


  function getElements(bo, type, prop) {
    var elems = extensionElementsHelper.getExtensionElements(bo, type) || [];
    return !prop ? elems : (elems[0] || {})[prop] || [];
  }

  function getExtensionElement(element) {
    var bo = getBusinessObject(element);
    return (getElements(bo, extensionElementKey) || [])[0];
  }

  var entry = entryFactory.textField({
    id: id,
    label: label,
    modelProperty: modelProperty,

    get: function(element, node) {
      var reference = definition.get(referenceProperty);
      var props = {};
      props[modelProperty] = reference && (getExtensionElement(reference) || {})[modelProperty];
      return props;
    },

    set: function(element, values, node) {

      var reference = definition.get(referenceProperty);
      var bo = getBusinessObject(reference);
      reference.businessObject = bo;
      var commands = [];
      var extensionElements = bo.get('extensionElements');
      if (!extensionElements) {
        extensionElements = elementHelper.createElement('bpmn:ExtensionElements', { values: [] }, bo, bpmnFactory);
        commands.push(cmdHelper.updateProperties(reference, { extensionElements: extensionElements }));
      }

      var extensionElement = getExtensionElement(reference);

      if (!extensionElement) {
        extensionElement = elementHelper.createElement(extensionElementKey, { }, extensionElements, bpmnFactory);
        commands.push(cmdHelper.addAndRemoveElementsFromList(
          element,
          extensionElements,
          'values',
          'extensionElements',
          [ extensionElement ],
          []
        ));
      }

      commands.push(cmdHelper.updateBusinessObject(element, extensionElement, values));
      return commands;
    },

    hidden: function(element, node) {
      return !definition.get(referenceProperty);
    }
  });

  if (shouldValidate) {
    entry.validate = function(element, values, node) {
      var reference = definition.get(referenceProperty);
      if (reference && !values[modelProperty]) {
        var validationErrors = {};
        validationErrors[modelProperty] = 'Must provide a value';
        return validationErrors;
      }
    };
  }

  return [ entry ];
};
