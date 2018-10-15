

var is = require('bpmn-js/lib/util/ModelUtil').is,
getBusinessObject = require('bpmn-js/lib/util/ModelUtil').getBusinessObject,
eventDefinitionHelper = require('bpmn-js-properties-panel/lib/helper/EventDefinitionHelper');
var message = require('bpmn-js-properties-panel/lib/provider/bpmn/parts/implementation/MessageEventDefinition');
var referenceExtensionElementProperty = require('./implementation/ElementReferenceExtensionElementProperty');

module.exports = function (group, element, bpmnFactory, elementRegistry, translate) {

var messageEventDefinition = eventDefinitionHelper.getMessageEventDefinition(element);

if (is(element, 'bpmn:ReceiveTask')) {
  message(group, element, bpmnFactory, getBusinessObject(element));
  group.entries = group.entries.concat(referenceExtensionElementProperty(element, getBusinessObject(element), bpmnFactory, {
    id: 'message-element-subscription',
    label: 'Subscription Correlation Key',
    referenceProperty: 'messageRef',
    modelProperty: 'correlationKey',
    extensionElement: 'zeebe:Subscription',
    shouldValidate: true
  }));
}else if( messageEventDefinition){
  message(group, element, bpmnFactory, messageEventDefinition);
  group.entries = group.entries.concat(referenceExtensionElementProperty(element, messageEventDefinition, bpmnFactory, {
    id: 'message-element-subscription',
    label: 'Subscription Correlation Key',
    referenceProperty: 'messageRef',
    modelProperty: 'correlationKey',
    extensionElement: 'zeebe:Subscription',
    shouldValidate: true
  }));
}


}


