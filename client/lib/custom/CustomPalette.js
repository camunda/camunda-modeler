'use strict';

var assign = require('lodash/object/assign');

/**
 * A palette that allows you to create BPMN _and_ custom elements.
 */
function PaletteProvider(palette, create, elementFactory, spaceTool, lassoTool, handTool, globalConnect, translate) {

  this._palette = palette;
  this._create = create;
  this._elementFactory = elementFactory;
  this._spaceTool = spaceTool;
  this._lassoTool = lassoTool;
  this._handTool = handTool;
  this._globalConnect = globalConnect;
  this._translate = translate;

  palette.registerProvider(this);
}

module.exports = PaletteProvider;

PaletteProvider.$inject = ['palette', 'create', 'elementFactory', 'spaceTool', 'lassoTool', 'handTool',
  'globalConnect',
  'translate'];


PaletteProvider.prototype.getPaletteEntries = function (element) {

  var actions = {},
    create = this._create,
    elementFactory = this._elementFactory,
    spaceTool = this._spaceTool,
    lassoTool = this._lassoTool,
    handTool = this._handTool,
    globalConnect = this._globalConnect,
    translate = this._translate;



  function createAction(type, group, className, title, options) {

    function createListener(event) {
      var shape = elementFactory.createShape(assign({ type: type }, options));

      if (options) {
        shape.businessObject.di.isExpanded = options.isExpanded;
      }

      create.start(event, shape);
    }

    var shortType = type.replace(/^bpmn\:/, '');

    return {
      group: group,
      className: className,
      title: title || 'Create ' + shortType,
      action: {
        dragstart: createListener,
        click: createListener
      }
    };
  }

  assign(actions, {
    'hand-tool': {
      group: 'tools',
      className: 'bpmn-icon-hand-tool',
      title: translate('Activate the hand tool'),
      action: {
        click: function (event) {
          handTool.activateHand(event);
        }
      }
    },
    'lasso-tool': {
      group: 'tools',
      className: 'bpmn-icon-lasso-tool',
      title: translate('Activate the lasso tool'),
      action: {
        click: function (event) {
          lassoTool.activateSelection(event);
        }
      }
    },
    'space-tool': {
      group: 'tools',
      className: 'bpmn-icon-space-tool',
      title: translate('Activate the create/remove space tool'),
      action: {
        click: function (event) {
          spaceTool.activateSelection(event);
        }
      }
    },
    'tool-separator': {
      group: 'tools',
      separator: true
    },
    'global-connect-tool': {
      group: 'tools',
      className: 'bpmn-icon-connection-multi',
      title: translate('Activate the global connect tool'),
      action: {
        click: function (event) {
          globalConnect.toggle(event);
        }
      }
    },
    'create.start-event': createAction(
      'bpmn:StartEvent', 'event', 'bpmn-icon-start-event-none'
    ),
    'create.end-event': createAction(
      'bpmn:EndEvent', 'event', 'bpmn-icon-end-event-none'
    ),
    'create.service-task': createAction(
      'bpmn:ServiceTask', 'activity', 'bpmn-icon-service-task'
    ),
    'create.receive-task': createAction(
      'bpmn:ReceiveTask', 'activity', 'bpmn-icon-receive-task'
    ),
    'create.subprocess-expanded': createAction(
      'bpmn:SubProcess', 'activity', 'bpmn-icon-subprocess-expanded',
      translate('Create expanded SubProcess'),
      { isExpanded: true }
    ),
    'create.intermediate-event': createAction(
      'bpmn:IntermediateThrowEvent', 'event', 'bpmn-icon-intermediate-event-none',
      translate('Create Intermediate/Boundary Event')
    ),
    'create.intermediate-catch-message-event': createAction(
      'bpmn:IntermediateCatchEvent', 'event', 'bpmn-icon-intermediate-event-catch-message', 'Message Event', { eventDefinitionType: 'bpmn:MessageEventDefinition' }
    ),
    'create.intermediate-catch-timer-event': createAction(
      'bpmn:IntermediateCatchEvent', 'event', 'bpmn-icon-intermediate-event-catch-timer', 'Timer Event', { eventDefinitionType: 'bpmn:TimerEventDefinition' }
    ),
    'create.exclusive-gateway': createAction(
      'bpmn:ExclusiveGateway', 'gateway', 'bpmn-icon-gateway-xor'
    )
  });

  return actions;
};
