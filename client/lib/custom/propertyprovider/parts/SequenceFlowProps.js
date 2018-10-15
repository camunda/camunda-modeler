'use strict';

var is = require('bpmn-js/lib/util/ModelUtil').is,
  isAny = require('bpmn-js/lib/features/modeling/util/ModelingUtil').isAny,
  getBusinessObject = require('bpmn-js/lib/util/ModelUtil').getBusinessObject,
  domQuery = require('min-dom').query,
  cmdHelper = require('bpmn-js-properties-panel/lib/helper/CmdHelper'),
  elementHelper = require('bpmn-js-properties-panel/lib/helper/ElementHelper'),
  eventDefinitionHelper = require('bpmn-js-properties-panel/lib/helper/EventDefinitionHelper');

module.exports = function (group, element, bpmnFactory, translate) {
  var bo = getBusinessObject(element);

  if (!bo) {
    return;
  }
  
  if (!isConditionalSource(element.source)) {
    return;
  }

  group.entries.push({
    id: 'condition',
    label: translate('Condition expression'),
    html:  // expression
            '<div class="bpp-row">' +
              '<label for="zeebe-condition">'+translate('Condition expression')+'</label>' +
              '<div class="bpp-field-wrapper">' +
                '<input id="zeebe-condition" type="text" name="condition" />' +
                '<button class="clear" data-action="clear" data-show="canClear">' +
                  '<span>X</span>' +
                '</button>' +
              '</div>' +
            '</div>',

    get: function (element, propertyName) {
       // read values from xml:
       var conditionExpression = bo.conditionExpression;

       var values = {},
           conditionType = '';
 
       if (conditionExpression) {
         conditionType = 'expression';
         values.condition = conditionExpression.get('body');
       }
 
       values.conditionType = conditionType;
 
       return values;

    },

    set: function (element, values, containerElement) {
      var conditionType = 'expression';
      var commands = [];

      var conditionProps = {
        body: undefined
      };

      var condition = values.condition;
      conditionProps.body = condition;

      var update = {
        'conditionExpression': undefined
      };

      if (conditionType) {
        update.conditionExpression = elementHelper.createElement(
          'bpmn:FormalExpression',
          conditionProps,
          bo,
          bpmnFactory
        );

        var source = element.source;

        // if default-flow, remove default-property from source
        if (source.businessObject.default === bo) {
          commands.push(cmdHelper.updateProperties(source, { 'default': undefined }));
        }
      }

      commands.push(cmdHelper.updateBusinessObject(element, bo, update));

      return commands;
    },

    validate: function (element, values) {
      var validationResult = {};

      if (!values.condition && values.conditionType === 'expression') {
        validationResult.condition = 'Must provide a value';
      }

      return validationResult;
    },

    isExpression: function (element, inputNode) {
      var conditionType = domQuery('select[name=conditionType]', inputNode);
      if (conditionType.selectedIndex >= 0) {
        return conditionType.options[conditionType.selectedIndex].value === 'expression';
      }
    },

    clear: function (element, inputNode) {
      // clear text input
      domQuery('input[name=condition]', inputNode).value = '';

      return true;
    },

    canClear: function (element, inputNode) {
      var input = domQuery('input[name=condition]', inputNode);

      return input.value !== '';
    },

    cssClasses: ['bpp-textfield']
  });
};


// utilities //////////////////////////

var CONDITIONAL_SOURCES = [
  'bpmn:Activity',
  'bpmn:ExclusiveGateway',
  'bpmn:InclusiveGateway',
  'bpmn:ComplexGateway'
];

function isConditionalSource(element) {
  return isAny(element, CONDITIONAL_SOURCES);
}
