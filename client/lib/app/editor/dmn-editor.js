'use strict';

var inherits = require('inherits');

var bind = require('lodash/function/bind'),
    assign = require('lodash/object/assign');

var DiagramEditor = require('./diagram-editor');

var WarningsOverlay = require('base/components/warnings-overlay');

var getWarnings = require('app/util/get-warnings');

var DmnJS = require('dmn-js/lib/Modeler'),
    diagramOriginModule = require('diagram-js-origin');

var generateImage = require('app/util/generate-image'),
    isInputActive = require('util/dom/is-input').active;

var getEntriesType = require('dmn-js/lib/table/util/SelectionUtil').getEntriesType;

var debug = require('debug')('dmn-editor');


/**
 * A DMN 1.1 diagram editing component.
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

  this._stackIdx = -1;
}

inherits(DmnEditor, DiagramEditor);

module.exports = DmnEditor;

// Need to replace the method from DiagramEditor,
// so that we trigger the correct commandStack undo/redo
DmnEditor.prototype.triggerAction = function(action, options) {
  var opts = options || {};

  var modeler = this.getModeler();

  modeler = modeler.getActiveEditor();

  var editorActions = modeler.get('editorActions', false);

  if (!editorActions) {
    return;
  }

  if (action === 'clauseAdd') {
    opts = options.type;
  }


  debug('editor-actions', action, options);

  // ignore all editor actions if there's a current active input or textarea
  if ([ 'insertNewLine', 'selectNextRow', 'selectPreviousRow' ].indexOf(action) === -1 && isInputActive()) {
    return;
  }

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
      tableCommandStack, diagramCommandStack, commandStack;

  var dirty, elements, elementsSelected,
      inputActive, elementType, editorState,
      stackIdx = -1;

  // ignore change events during import
  if (initialState.importing) {
    return;
  }

  var stateContext = {
    dmn: true,
    activeEditor: this.getActiveEditorName(),
    undo: !!initialState.undo,
    redo: !!initialState.redo,
    dirty: initialState.dirty,
    exportAs: false
  };

  if (stateContext.activeEditor === 'diagram') {
    stateContext.exportAs = [ 'png', 'jpeg', 'svg' ];
  }

  // no diagram to harvest, good day maam!
  if (isImported(modeler)) {

    diagramCommandStack = modeler.get('commandStack');
    tableCommandStack = modeler.table.get('commandStack');

    if (stateContext.activeEditor === 'table') {

      elements = modeler.table.get('selection').get();
      elementType = getEntriesType(elements);

      editorState = {
        dmnRuleEditing: elementType.rule,
        dmnClauseEditing: elementType.input || elementType.output
      };

      commandStack = tableCommandStack;
    } else if (stateContext.activeEditor) {
      // direct editing function
      elements = modeler.get('selection').get();
      elementsSelected = false;

      if (elements.length >= 1) {
        elementsSelected = true;
      }

      inputActive = isInputActive();

      editorState = {
        elementsSelected: elementsSelected && !inputActive,
        inactiveInput: !inputActive
      };

      commandStack = diagramCommandStack;
    }

    // we have to do this, in order to keep track if there are changes in any of the commandStacks
    stackIdx = this.getStackIndex();

    dirty = (
      initialState.dirty ||
      initialState.reimported ||
      initialState.stackIndex !== stackIdx
    );

    stateContext = assign(stateContext, {
      undo: commandStack.canUndo(),
      redo: commandStack.canRedo(),
      dirty: dirty,
      editable: true
    }, editorState);
  }

  this.emit('state-updated', stateContext);
};

DmnEditor.prototype.getStackIndex = function() {
  var modeler = this.getModeler(),
      diagramStackIdx, tableStackIdx;

  if (isImported(modeler)) {
    diagramStackIdx = modeler.get('commandStack')._stackIdx;

    tableStackIdx = modeler.table.get('commandStack')._stackIdx;

    return diagramStackIdx > tableStackIdx ? diagramStackIdx : tableStackIdx;
  }

  return -1;
};

DmnEditor.prototype.getActiveEditorName = function() {
  var modeler = this.getModeler(),
      name, decision;

  if (modeler === modeler.getActiveEditor()) {
    name = 'diagram';
  } else {
    decision = modeler.table.getCurrentDecision();

    if (decision && decision.literalExpression) {
      name = 'literal-expression';
    } else {
      name = 'table';
    }
  }

  return name;
};


DmnEditor.prototype.getModeler = function() {

  if (!this.modeler) {

    // lazily instantiate and cache
    this.modeler = this.createModeler(this.$el);

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
      'selection.changed',
      'view.switch'
    ], this.updateState, this);

    this.modeler.table.on([
      'commandStack.changed',
      'selection.changed'
    ], this.updateState, this);

    this.setupSimpleModeListener(this.modeler.table);

    // Make sure that we export if there any changes in one of the editors
    this.modeler.on('view.switch', function(context) {
      var table = this.modeler.table,
          simpleMode = table.get('simpleMode');

      this.initialState.stackIndex = -1;

      if (context.fromTable) {
        return;
      }

      if (this._isSimpleModeActive) {
        simpleMode.activate();
      } else {
        simpleMode.deactivate();
      }
    }, this);

    // log errors into log
    this.modeler.on('error', bind((error) => {
      this.emit('log', [[ 'error', error.error ]]);
      this.emit('log:toggle', { open: true });
    }, this));
  }

  return this.modeler;
};

DmnEditor.prototype.createModeler = function($el) {
  var file = this.file,
      loadDiagram = false;

  if (file && file.loadDiagram) {
    loadDiagram = file.loadDiagram;
  }

  return new DmnJS({
    loadDiagram: loadDiagram,
    position: 'absolute',
    container: $el,
    table: {
      minColWidth: 200,
      tableName: 'DMN Table'
    },
    additionalModules: [
      diagramOriginModule
    ]
  });
};

DmnEditor.prototype.resize = function() {
  var modeler = this.getModeler(),
      sheetOrCanvas;

  if (!isImported(modeler)) {
    return;
  }

  if (this.getActiveEditorName() === 'diagram') {
    sheetOrCanvas = modeler.get('canvas');
  } else {
    sheetOrCanvas = modeler.table.get('sheet');
  }

  sheetOrCanvas.resized();
};

DmnEditor.prototype.exportAs = function(type, done) {
  var modeler = this.getModeler();

  modeler.saveSVG((err, svg) => {
    var file = {};

    if (err) {
      return done(err);
    }

    if (type !== 'svg') {
      try {
        assign(file, { contents: generateImage(type, svg) });
      } catch (err) {
        return done(err);
      }
    } else {
      assign(file, { contents: svg });
    }

    done(null, file);
  });
};

DmnEditor.prototype.saveXML = function(done) {
  var modeler = this.getModeler(),
      commandStackIdx = this.getStackIndex();

  this._saveXML(modeler, commandStackIdx, done);
};

DmnEditor.prototype.setupSimpleModeListener = function(table) {
  var eventBus = table.get('eventBus');

  this._isSimpleModeActive = true;

  eventBus.on('simpleMode.activated', function() {
    this._isSimpleModeActive = true;
  }, this);

  eventBus.on('simpleMode.deactivated', function() {
    this._isSimpleModeActive = false;
  }, this);
};

DmnEditor.prototype.render = function() {
  var warnings = getWarnings(this.lastImport);

  return (
    <div className="dmn-editor" key={ this.id }>
      <div className="editor-container"
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
