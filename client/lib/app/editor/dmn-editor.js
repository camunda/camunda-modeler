'use strict';

var inherits = require('inherits');

var bind = require('lodash/function/bind');

var DiagramEditor = require('./diagram-editor');

var DmnJS = require('dmn-js/lib/Modeler');

var getEntriesType = require('dmn-js/lib/util/SelectionUtil').getEntriesType;


/**
 * A BPMN 2.0 diagram editing component.
 *
 * @param {Object} options
 */
function DmnEditor(options) {
  DiagramEditor.call(this, options);
}

inherits(DmnEditor, DiagramEditor);

module.exports = DmnEditor;


DmnEditor.prototype.triggerAction = function(action, options) {
  this.constructor.super_.prototype.triggerAction.apply(this, [action, options]);

  var modeler = this.getModeler();

  var editorActions = modeler.get('editorActions', false);

  if (!editorActions) {
    return;
  }

  // forward other actions to editor actions
  editorActions.trigger(action, options);
};


/**
 * Update editor state after changes in the
 * underlying diagram or XML.
 */
DmnEditor.prototype.updateState = function() {

  var modeler = this.getModeler(),
      commandStack,
      initialState = this.initialState;

  var stateContext = {},
      dirty;

  // no diagram to harvest, good day maam!
  if (isImported(modeler)) {
    commandStack = modeler.get('commandStack');

    dirty = (
      initialState.dirty ||
      initialState.reimported ||
      initialState.stackIndex !== commandStack._stackIdx
    );

    var element = modeler.get('selection').get();
    var elementType = getEntriesType(element);

    // TODO(nikku): complete / more updates?
    stateContext = {
      undo: commandStack.canUndo(),
      redo: commandStack.canRedo(),
      dirty: dirty,
      dmnRuleEditing: elementType.rule,
      dmnClauseEditing: elementType.input || elementType.output
    };
  }

  this.emit('state-updated', stateContext);
};

DmnEditor.prototype.getStackIndex = function() {
  var modeler = this.getModeler();

  return isImported(modeler) ? modeler.get('commandStack')._stackIdx : -1;
};


DmnEditor.prototype.getModeler = function() {

  if (!this.modeler) {

    // lazily instantiate and cache
    this.modeler = this.createModeler(this.$el);

    // TODO(nikku): remove bind once dmn-js supports
    //              additional that argument in Modeler#on

    // hook up with modeler change events
    this.modeler.on([
      'commandStack.changed',
      'selection.changed'
    ], bind(this.updateState, this));
  }

  return this.modeler;
};

DmnEditor.prototype.createModeler = function($el) {
  return new DmnJS({ container: $el });
};

DmnEditor.prototype.render = function() {

  return (
    <div className="dmn-editor" key={ this.id }>
      <div className="editor-container"
           tabIndex="0"
           onAppend={ this.compose('mountEditor') }
           onRemove={ this.compose('unmountEditor') }>
      </div>
    </div>
  );
};

function isImported(modeler) {
  return !!modeler.table;
}
