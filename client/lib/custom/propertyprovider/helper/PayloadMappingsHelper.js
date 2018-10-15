'use strict';

var ModelUtil         = require('bpmn-js/lib/util/ModelUtil'),
    is                = ModelUtil.is,
    getBusinessObject = ModelUtil.getBusinessObject;

var extensionElementsHelper = require('bpmn-js-properties-panel/lib/helper/ExtensionElementsHelper');

var PayloadMappingHelper = {};

module.exports = PayloadMappingHelper;


function getElements(bo, type, prop) {
  var elems = extensionElementsHelper.getExtensionElements(bo, type) || [];
  return !prop ? elems : (elems[0] || {})[prop] || [];
}

/**
 * Get a payloadMappings object from the business object
 *
 * @param {djs.model.Base} element
 * 
 * @param {djs.model.Base} props
 *
 * @return {ModdleElement} the payloadMappings object
 */

function getParameters(element, prop) {
  var inputOutput = PayloadMappingHelper.getPayloadMappings(element);
  return (inputOutput && inputOutput.get(prop)) || [];
}

/**
 * Get a payloadMappings object from the business object
 *
 * @param {djs.model.Base} element
 *
 * @return {ModdleElement} the payloadMappings object
 */
PayloadMappingHelper.getPayloadMappings = function(element) {
  var bo = getBusinessObject(element);
  return (getElements(bo, 'zeebe:PayloadMappings') || [])[0];
};


/**
 * Return all input parameters existing in the business object, and
 * an empty array if none exist.
 *
 * @param  {djs.model.Base} element
 *
 * @return {Array} a list of mapping objects
 */
PayloadMappingHelper.getMappings = function(element) {
  return getParameters.apply(this, [ element, 'mapping' ]);
};

/**
 * Get a mappings from the business object at given index
 *
 * @param {djs.model.Base} element
 * @param {number} idx
 *
 * @return {ModdleElement} input parameter
 */
PayloadMappingHelper.getMapping = function(element, idx) {
  return this.getMappings(element)[idx];
};

/**
 * Returns 'true' if the given element supports inputOutput
 *
 * @param {djs.model.Base} element
 *
 * @return {boolean} a boolean value
 */
PayloadMappingHelper.isPayloadMappingsSupported = function(element) {
  var bo = getBusinessObject(element);

  if(is(bo, 'bpmn:SequenceFlow') && is(element.target, 'bpmn:ParallelGateway')){
    return true;
  }
  return (is(bo, 'bpmn:EndEvent') );
};
