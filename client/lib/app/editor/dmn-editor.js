'use strict';

var inherits = require('inherits');

var assign = require('lodash/object/assign'),
    forEach = require('lodash/collection/forEach');

var DiagramEditor = require('./diagram-editor');

var WarningsOverlay = require('base/components/warnings-overlay');

var getWarnings = require('app/util/get-warnings');

import DmnJS from './dmn/CamundaDmnEditor';

var diagramOriginModule = require('diagram-js-origin');

var generateImage = require('app/util/generate-image'),
    isInputActive = require('util/dom/is-input').active;

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

    // TODO(philippfromme): makes sure XML is always saved
    // since we have more than one command stack in some cases XML wouldn't be saved
    // XML editor then wouldn't show actual XML
    this.initialState.forceSaveXML = true;
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

  var editorActions = modeler.getActiveViewer().get('editorActions', false);

  if (!editorActions) {
    return;
  }

  debug('editor-actions', action, options);

  // forward other actions to editor actions
  editorActions.trigger(action, opts);
};


/**
 * Update editor state after changes in the
 * underlying diagram or XML.
 */
DmnEditor.prototype.updateState = function(options = {}) {

  var modeler = this.getModeler(),
      initialState = this.initialState;

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

  // no diagram to harvest, good day maam!
  if (isImported(modeler)) {
    var activeView = modeler.getActiveView(),
        activeViewer = modeler.getActiveViewer(),
        commandStack = activeViewer.get('commandStack');

    var selection;

    if (activeView.type === 'decision-table') {
      var decisionTableViewer = modeler.getActiveViewer();

      selection = decisionTableViewer.get('selection');

      if (selection.hasSelection()) {
        stateContext.dmnClauseEditing = true;
        stateContext.dmnRuleEditing = true;
      } else {
        stateContext.dmnClauseEditing = false;
        stateContext.dmnRuleEditing = false;
      }
    } else if (activeView.type === 'drd') {
      var drdViewer = modeler.getActiveViewer();

      selection = drdViewer.get('selection');

      stateContext.elementsSelected = !!selection.get().length;

      // TODO(philippfromme): fix, this always returns false
      // when wrapping this with setTimeout it works as expected
      var inputActive = isInputActive();

      stateContext.inactiveInput = !inputActive;

      stateContext.exportAs = [ 'png', 'jpeg', 'svg' ];
    }

    var dirty = (
      initialState.dirty ||
      initialState.reimported ||
      initialState.stackIndex !== this.getStackIndex()
    );

    stateContext = assign(stateContext, {
      undo: commandStack.canUndo(),
      redo: commandStack.canRedo(),
      dirty: dirty,
      editable: true
    });
  }

  this.emit('state-updated', stateContext);
};

DmnEditor.prototype.getStackIndex = function() {
  // TODO(nikku): extract meaningful stack index (if possible at all?)
  // TODO(philippfromme): when switching viewer command stack of previous viewer is reset
  // therefore dirty checking doesn't work anymore

  var stackIdx = -1;

  forEach(this.getModeler()._viewers, viewer => {
    var commandStack = viewer.get('commandStack');

    stackIdx += commandStack._stackIdx + 1;
  });

  return stackIdx;
};

DmnEditor.prototype.getActiveEditorName = function() {

  var modeler = this.getModeler();

  var activeView = modeler.getActiveView();

  return activeView && activeView.type;
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
    // TODO(nikku): hook up with change events?

    var updateState = (options = {}) => (event) => {
      this.updateState(options, event);
    };

    this.modeler.on('views.changed', updateState());

    this.modeler.on('view.contentChanged', updateState({ contentChanged: true }));

    this.modeler.on('view.selectionChanged', updateState());

    // log editor errors
    // log errors into log
    this.modeler.on('error', ({ error, viewer }) => {
      this.emit('log', [
        [ 'error', error.stack ]
      ]);
      this.emit('log:toggle', { open: true });
    });
  }

  return this.modeler;
};

DmnEditor.prototype.createModeler = function($el) {
  return new DmnJS({
    'position': 'absolute',
    'container': $el,
    'decision-table': {
      minColWidth: 200,
      tableName: 'DMN Table'
    },
    'drd': {
      additionalModules: [
        diagramOriginModule
      ]
    }
  });
};

DmnEditor.prototype.resize = function() {
  var modeler = this.getModeler();

  if (!isImported(modeler)) {
    return;
  }

  var viewer = modeler.getActiveViewer();

  // notify active editor that the view
  // got resized
  switch (this.getActiveEditorName()) {
  case 'drd':
    viewer.get('canvas').resized();
    break;
  case 'decisionTable':
    viewer.get('sheet').resized();
    break;
  }
};

DmnEditor.prototype.exportAs = function(type, done) {
  var drdJS = this.getModeler().getActiveViewer();

  drdJS.saveSVG((err, svg) => {
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

DmnEditor.prototype.render = function() {
  var warnings = getWarnings(this.lastImport);

  return (
    <div className="dmn-editor" key={ this.id }>
      <div
        className="editor-container"
        onAppend={ this.compose('mountEditor') }
        onRemove={ this.compose('unmountEditor') }>
      </div>
      <WarningsOverlay
        warnings={ warnings }
        onOpenLog={ this.compose('openLog') }
        onClose={ this.compose('hideWarnings') } />
    </div>
  );
};

function isImported(modeler) {
  return modeler.getDefinitions();
}
