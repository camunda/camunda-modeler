'use strict';

var inherits = require('inherits'),
    is = require('bpmn-js/lib/util/ModelUtil').is;

var RuleProvider = require('diagram-js/lib/features/rules/RuleProvider').default;

var HIGH_PRIORITY = 1500;

function hasOutgoings(element) {
  return element.outgoing && element.outgoing.length > 0;
}
/**
 * Specific rules for custom elements
 */
function CustomRules(eventBus) {
  RuleProvider.call(this, eventBus);
}

inherits(CustomRules, RuleProvider);

CustomRules.$inject = [ 'eventBus' ];

module.exports = CustomRules;


CustomRules.prototype.init = function() {

  /**
   * Can shape be created on target container?
   */
  function canCreate(source) {

    if (is(source, 'bpmn:ExclusiveGateway')) {
      return true;
    }

    return !hasOutgoings(source);
  }

  /**
   * Can source and target be connected?
   */
  function canConnect(source, target) {

    if (is(source, 'bpmn:ExclusiveGateway')) {
      return true;
    }

    return !hasOutgoings(source);
    
  }

  this.addRule('shape.append', HIGH_PRIORITY, function(context) {
    var source = context.source;

    return canCreate(source);
  });


  this.addRule('connection.create', HIGH_PRIORITY, function(context) {
    var source = context.source,
        target = context.target;

    return canConnect(source, target);
  });
};
