'use strict';

var timer = require('./implementation/TimerEventDefinition'),
eventDefinitionHelper = require('bpmn-js-properties-panel/lib/helper/EventDefinitionHelper');

module.exports = function(group, element, bpmnFactory, options) {

  var timerEventDefinition = eventDefinitionHelper.getTimerEventDefinition(element);
  if(timerEventDefinition){
    timer(group,element,bpmnFactory,timerEventDefinition);
  }

};

