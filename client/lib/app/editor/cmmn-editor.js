'use strict';

var inherits = require('inherits');

var assign = require('lodash/object/assign');

var DiagramEditor = require('./diagram-editor');

var ensureOpts = require('util/ensure-opts'),
    isInputActive = require('util/dom/is-input').active;

var WarningsOverlay = require('base/components/warnings-overlay');

var getWarnings = require('app/util/get-warnings'),
    generateImage = require('app/util/generate-image');

var CmmnJS = require('cmmn-js/lib/Modeler');

var DiagramJSOrigin = require('diagram-js-origin');

var debug = require('debug')('cmmn-editor');


/**
 * A CMMN 1.1 diagram editing component.
 *
 * @param {Object} options
 */
function CmmnEditor(options) {

  ensureOpts([
    'config',
    'metaData'
  ], options);

  DiagramEditor.call(this, options);

  this.name = 'cmmn';

  // set current modeler version and name to the diagram
  this.on('save', () => {
    var definitions = this.getModeler().definitions;

    if (definitions) {
      definitions.exporter = options.metaData.name;
      definitions.exporterVersion = options.metaData.version;
    }
  });

}

inherits(CmmnEditor, DiagramEditor);

module.exports = CmmnEditor;


CmmnEditor.prototype.triggerEditorActions = function(action, options) {
  var opts = options || {};

  var modeler = this.getModeler();

  var editorActions = modeler.get('editorActions', false);

  if (!editorActions) {
    return;
  }

  if ('moveCanvas' === action) {
    opts = assign({ speed: 20 }, options);
  }

  if ('zoomIn' === action) {
    action = 'stepZoom';

    opts = {
      value: 1
    };
  }

  if ('zoomOut' === action) {
    action = 'stepZoom';

    opts = {
      value: -1
    };
  }

  if ('zoom' === action) {
    opts = assign({
      value: 1
    }, options);
  }

  // ignore all editor actions (besides the following three)
  // if there's a current active input or textarea
  if ([ 'removeSelection', 'stepZoom', 'zoom' ].indexOf(action) === -1 && isInputActive()) {
    return;
  }

  debug('editor-actions', action, opts);

  // forward other actions to editor actions
  editorActions.trigger(action, opts);
};


CmmnEditor.prototype.updateState = function() {

  var modeler = this.getModeler(),
      initialState = this.initialState,
      commandStack,
      inputActive;

  // ignore change events during import
  if (initialState.importing) {
    return;
  }

  var elementsSelected,
      elements,
      dirty;

  var stateContext = {
    cmmn: true,
    copy: false,
    paste: false,
    save: true,
    undo: !!initialState.undo,
    redo: !!initialState.redo,
    dirty: initialState.dirty,
    exportAs: [ 'png', 'jpeg', 'svg' ]
  };

  if (isImported(modeler)) {
    commandStack = modeler.get('commandStack');

    dirty = (
      initialState.dirty ||
      initialState.reimported ||
      initialState.stackIndex !== commandStack._stackIdx
    );

    // direct editing function
    elements = modeler.get('selection').get();
    elementsSelected = false;

    if (elements.length >= 1) {
      elementsSelected = true;
    }

    inputActive = isInputActive();

    stateContext = assign(stateContext, {
      undo: commandStack.canUndo(),
      redo: commandStack.canRedo(),
      elementsSelected: elementsSelected && !inputActive,
      dirty: dirty,
      zoom: true,
      editable: true,
      inactiveInput: !inputActive
    });
  }

  this.emit('state-updated', stateContext);
};


CmmnEditor.prototype.getModeler = function() {

  if (!this.modeler) {

    // lazily instantiate and cache
    this.modeler = this.createModeler(this.$el);

    // hook up with modeler change events
    this.modeler.on([
      'commandStack.changed',
      'selection.changed'
    ], this.updateState, this);

    // add importing flag (high priority)
    this.modeler.on('import.parse.start', 1500, () => {
      this.initialState.importing = true;
    });

    // remove importing flag (high priority)
    this.modeler.on('import.done', 1500, () => {
      this.initialState.importing = false;
    });
  }

  return this.modeler;
};


CmmnEditor.prototype.createModeler = function($el) {

  return new CmmnJS({
    container: $el,

    additionalModules: [ DiagramJSOrigin ]
  });
};

CmmnEditor.prototype.exportAs = function(type, done) {
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


CmmnEditor.prototype.getStackIndex = function() {
  var modeler = this.getModeler();

  return isImported(modeler) ? modeler.get('commandStack')._stackIdx : -1;
};


CmmnEditor.prototype.logTemplateWarnings = function(warnings) {

  var messages = warnings.map(function(warning) {
    return [ 'warning', '> ' + warning.message ];
  });

  messages.push([ 'warning', '' ]);

  this.log(messages, true);
};


CmmnEditor.prototype.resizeCanvas = function() {
  var modeler = this.getModeler(),
      canvas = modeler.get('canvas');

  canvas.resized();
};


CmmnEditor.prototype.render = function() {

  var warnings = getWarnings(this.lastImport);

  return (
    <div className="cmmn-editor"
         key={ this.id + '#cmmn' }
         onFocusin={ this.compose('updateState') }>
      <div className="editor-container"
           tabIndex="0"
           onAppend={ this.compose('mountEditor') }
           onRemove={ this.compose('unmountEditor') }>
      </div>
      <WarningsOverlay warnings={ warnings }
                 onShowDetails={ this.compose('openLog') }
                 onClose={ this.compose('hideWarnings') } />
    </div>
  );
};

function isImported(modeler) {
  return !!modeler.definitions;
}
