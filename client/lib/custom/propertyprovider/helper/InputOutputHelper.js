'use strict';

var ModelUtil         = require('bpmn-js/lib/util/ModelUtil'),
    is                = ModelUtil.is,
    getBusinessObject = ModelUtil.getBusinessObject;

var extensionElementsHelper = require('bpmn-js-properties-panel/lib/helper/ExtensionElementsHelper');

var InputOutputHelper = {};

module.exports = InputOutputHelper;

function getElements(bo, type, prop) {
  var elems = extensionElementsHelper.getExtensionElements(bo, type) || [];
  return !prop ? elems : (elems[0] || {})[prop] || [];
}

function getParameters(element, prop) {
  var inputOutput = InputOutputHelper.getInputOutput(element);
  return (inputOutput && inputOutput.get(prop)) || [];
}

/**
 * Get a inputOutput from the business object
 *
 * @param {djs.model.Base} element
 *
 * @return {ModdleElement} the inputOutput object
 */
InputOutputHelper.getInputOutput = function(element) {
  var bo = getBusinessObject(element);
  return (getElements(bo, 'zeebe:IoMapping') || [])[0];
};


/**
 * Return all input parameters existing in the business object, and
 * an empty array if none exist.
 *
 * @param  {djs.model.Base} element
 *
 * @return {Array} a list of input parameter objects
 */
InputOutputHelper.getInputParameters = function(element) {
  return getParameters.apply(this, [ element, 'inputParameters' ]);
};

/**
 * Return all output parameters existing in the business object, and
 * an empty array if none exist.
 *
 * @param  {djs.model.Base} element
 *
 * @return {Array} a list of output parameter objects
 */
InputOutputHelper.getOutputParameters = function(element) {
  return getParameters.apply(this, [ element, 'outputParameters' ]);
};

/**
 * Get a input parameter from the business object at given index
 *
 * @param {djs.model.Base} element
 * @param {number} idx
 *
 * @return {ModdleElement} input parameter
 */
InputOutputHelper.getInputParameter = function(element, idx) {
  return this.getInputParameters(element)[idx];
};

/**
 * Get a output parameter from the business object at given index
 *
 * @param {djs.model.Base} element
 * @param {number} idx
 *
 * @return {ModdleElement} output parameter
 */
InputOutputHelper.getOutputParameter = function(element, idx) {
  return this.getOutputParameters(element)[idx];
};

/**
 * Returns 'true' if the given element supports inputOutput
 *
 * @param {djs.model.Base} element
 *
 * @return {boolean} a boolean value
 */
InputOutputHelper.isInputOutputSupported = function(element) {
  var bo = getBusinessObject(element);
  return (is(bo, 'bpmn:ServiceTask') || is(bo, 'bpmn:SubProcess'));
};

/**
 * Returns 'true' if the given element supports output parameters
 *
 * @param {djs.model.Base} element
 *
 * @return {boolean} a boolean value
 */
InputOutputHelper.areOutputParametersSupported = function(element) {
  var bo = getBusinessObject(element);
  return (is(bo, 'bpmn:ServiceTask') || is(bo, 'bpmn:SubProcess'));
};
