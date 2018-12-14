'use strict';

var inherits = require('inherits'),
  is = require('bpmn-js/lib/util/ModelUtil').is,
  assign = require('lodash/object/assign'),
  bind = require('lodash/function/bind');

var ContextPadProvider = require('bpmn-js/lib/features/context-pad/ContextPadProvider').default;

var availableActions = require('./modeler-options/Options').AVAILABLE_CONTEXTPAD_ENTRIES;

function CustomContextPadProvider(config, injector, eventBus, contextPad, modeling, elementFactory, connect, create, popupMenu, canvas, rules, translate) {
  ContextPadProvider.call(this, config, injector, eventBus, contextPad, modeling, elementFactory, connect, create, popupMenu, canvas, rules, translate);
  var autoPlace = undefined;
  if (config.autoPlace !== false) {
    autoPlace = injector.get('autoPlace', false);
  }

  var cached = bind(this.getContextPadEntries, this);

  

  this.getContextPadEntries = function (element) {
    var actions = cached(element);

    var businessObject = element.businessObject;

    /**
   * Create an append action
   *
   * @param {String} type
   * @param {String} className
   * @param {String} [title]
   * @param {Object} [options]
   *
   * @return {Object} descriptor
   */
  function appendAction(type, className, title, options) {

    if (typeof title !== 'string') {
      options = title;
      title = translate('Append {type}', { type: type.replace(/^bpmn:/, '') });
    }

    function appendStart(event, element) {

      var shape = elementFactory.createShape(assign({ type: type }, options));
      create.start(event, shape, element);
    }


    var append = autoPlace ? function(event, element) {
      var shape = elementFactory.createShape(assign({ type: type }, options));

      autoPlace.append(element, shape);
    } : appendStart;


    return {
      group: 'model',
      className: className,
      title: title,
      action: {
        dragstart: appendStart,
        click: append
      }
    };
  }


    var filteredActions = {};

    if (!is(businessObject, 'bpmn:EndEvent')) {
      if(!is(businessObject, 'bpmn:EventBasedGateway')){
        assign(filteredActions, { 'append.append-service-task': appendAction('bpmn:ServiceTask', 'bpmn-icon-service-task') });
        assign(filteredActions, { 'append.append-send-task': appendAction('bpmn:ReceiveTask', 'bpmn-icon-receive-task') });
      }
      assign(filteredActions, { 'append.append-message-event': appendAction('bpmn:IntermediateCatchEvent', 'bpmn-icon-intermediate-event-catch-message', 'Message Event', { eventDefinitionType: 'bpmn:MessageEventDefinition' }) });
      assign(filteredActions, { 'append.append-timer-event': appendAction('bpmn:IntermediateCatchEvent', 'bpmn-icon-intermediate-event-catch-timer', 'Timer Event', { eventDefinitionType: 'bpmn:TimerEventDefinition' }) });
    }

    for (var i = 0; i < availableActions.length; i++) {
      var availableAction = availableActions[i];
      if (actions[availableAction]) {
       // if (availableAction == 'replace' && !is(businessObject, 'bpmn:SequenceFlow')) {
        //  continue;
       // }
        filteredActions[availableAction] = actions[availableAction];
      }
    }
    return filteredActions;
  };
}

inherits(CustomContextPadProvider, ContextPadProvider);

CustomContextPadProvider.$inject = [
  'config',
  'injector',
  'eventBus',
  'contextPad',
  'modeling',
  'elementFactory',
  'connect',
  'create',
  'popupMenu',
  'canvas',
  'rules',
  'translate'
];

module.exports = CustomContextPadProvider;
