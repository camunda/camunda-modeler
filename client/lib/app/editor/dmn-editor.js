'use strict';

var inherits = require('inherits');

var bind = require('lodash/function/bind'),
    assign = require('lodash/object/assign');

var DiagramEditor = require('./diagram-editor');

var WarningsOverlay = require('base/components/warnings-overlay');

var getWarnings = require('app/util/get-warnings');

var DmnJS = require('dmn-js/lib/table/Modeler');

var getEntriesType = require('dmn-js/lib/table/util/SelectionUtil').getEntriesType;

var debug = require('debug')('dmn-editor');


/**
 * A BPMN 2.0 diagram editing component.
 *
 * @param {Object} options
 */
function DmnEditor(options) {
  DiagramEditor.call(this, options);

  this.name = 'dmn';

  this.on('imported', (context) => {
    var warnings = context.warnings;

    if (warnings && warnings.length) {
      console.log(warnings);
    }
  });
}

inherits(DmnEditor, DiagramEditor);

module.exports = DmnEditor;


DmnEditor.prototype.triggerEditorActions = function(action, options) {
  var opts = options || {};

  var modeler = this.getModeler();

  var editorActions = modeler.get('editorActions', false);

  if (!editorActions) {
    return;
  }

  if (action === 'clauseAdd') {
    opts = options.type;
  }

  debug('editor-actions', action, options);

  // forward other actions to editor actions
  editorActions.trigger(action, opts);
};


/**
 * Update editor state after changes in the
 * underlying diagram or XML.
 */
DmnEditor.prototype.updateState = function() {

  var modeler = this.getModeler(),
      initialState = this.initialState,
      commandStack;

  var dirty;

  // ignore change events during import
  if (initialState.importing) {
    return;
  }

  var stateContext = {
    dmn: true,
    undo: !!initialState.undo,
    redo: !!initialState.redo,
    dirty: initialState.dirty,
    exportAs: false
  };

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

    stateContext = assign(stateContext, {
      undo: commandStack.canUndo(),
      redo: commandStack.canRedo(),
      dirty: dirty,
      dmnRuleEditing: elementType.rule,
      dmnClauseEditing: elementType.input || elementType.output,
      editable: true
    });
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

    // add importing flag (high priority)
    this.modeler.on('import.parse.start', 1500, () => {
      this.initialState.importing = true;
    });

    // remove importing flag (high priority)
    this.modeler.on('import.done', 1500, () => {
      this.initialState.importing = false;
    });

    // hook up with modeler change events
    this.modeler.on([
      'commandStack.changed',
      'selection.changed'
    ], this.updateState, this);

    // log errors into log
    this.modeler.on('error', bind((error) => {
      this.emit('log', [[ 'error', error.error ]]);
      this.emit('log:toggle', { open: true });
    }, this));
  }

  return this.modeler;
};

DmnEditor.prototype.createModeler = function($el) {
  return new DmnJS({ container: $el, minColWidth: 200 });
};

DmnEditor.prototype.resize = function() {
  var modeler = this.getModeler(),
      sheet;

  if (!isImported(modeler)) {
    return;
  }

  sheet = modeler.get('sheet');

  sheet.resized();
};

DmnEditor.prototype.render = function() {
  var warnings = getWarnings(this.lastImport);

  return (
    <div className="dmn-editor" key={ this.id }>
      <div className="editor-container"
           tabIndex="0"
           onAppend={ this.compose('mountEditor') }
           onRemove={ this.compose('unmountEditor') }>
      </div>
      <WarningsOverlay warnings={ warnings }
                       onOpenLog={ this.compose('openLog') }
                       onClose={ this.compose('hideWarnings') } />
    </div>
  );
};

function isImported(modeler) {
  return !!modeler.definitions;
}
