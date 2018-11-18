'use strict';

var elementHelper = require('bpmn-js-properties-panel/lib/helper/ElementHelper'),
    cmdHelper = require('bpmn-js-properties-panel/lib/helper/CmdHelper');

var entryFactory = require('bpmn-js-properties-panel/lib/factory/EntryFactory');


/**
 * Creates 'bpmn:FormalExpression' element.
 *
 * @param {ModdleElement} parent
 * @param {string} body
 * @param {BpmnFactory} bpmnFactory
 *
 * @return {ModdleElement<bpmn:FormalExpression>} a formal expression
 */
function createFormalExpression(parent, body, bpmnFactory) {
    body = body || undefined;
    return elementHelper.createElement('bpmn:FormalExpression', { body: body }, parent, bpmnFactory);
  }

function TimerEventDefinition(group, element, bpmnFactory, timerEventDefinition) {

  group.entries.push(entryFactory.textField({
    id: 'timer-event-duration',
    label: 'Timer Duration',
    modelProperty: 'timerDefinition',

    get: function(element, node) {
      var type = 'timeDuration'
      var definition = type && timerEventDefinition.get(type);
      var value = definition && definition.get('body');
      return {
        timerDefinition: value
      };
    },

    set: function(element, values) {
      var type = 'timeDuration'
      var definition = type && timerEventDefinition.get(type);
      var commands = [];
      
      if(!definition){
        definition = createFormalExpression(timerEventDefinition, {}, bpmnFactory);
        commands.push(cmdHelper.updateBusinessObject(element, timerEventDefinition, {'timeDuration': definition}));
      }

      if (definition) {
        commands.push(cmdHelper.updateBusinessObject(element, definition, {
            body: values.timerDefinition || undefined
          }));
        return commands;
      }
    },

    validate: function(element) {
      var type = 'timeDuration'
      var definition = type && timerEventDefinition.get(type);
      if (definition) {
        var value = definition.get('body');
        if (!value) {
          return {
            timerDefinition: 'Must provide a value'
          };
        }
      }
    }

  }));

}

module.exports = TimerEventDefinition;
