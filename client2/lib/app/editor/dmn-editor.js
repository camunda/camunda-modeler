'use strict';

var inherits = require('inherits');

var Loader = require('./loader');

import {
  assign,
  forEach
} from 'min-dash';

import {
  closest as domClosest,
  domify
} from 'min-dom';

var DiagramEditor = require('./diagram-editor');

var WarningsOverlay = require('base/components/warnings-overlay');

var getWarnings = require('app/util/get-warnings');

import DmnJS from './dmn/CamundaDmnEditor';

var diagramOriginModule = require('diagram-js-origin').default;

var generateImage = require('app/util/generate-image'),
    isInput = require('util/dom/is-input'),
    isInputActive = require('util/dom/is-input').active,
    dragger = require('util/dom/dragger'),
    copy = require('util/copy');

var debug = require('debug')('dmn-editor');

var propertiesPanelModule = require('dmn-js-properties-panel').default,
    propertiesProviderModule = require('dmn-js-properties-panel/lib/provider/camunda').default,
    camundaModdlePackage = require('camunda-dmn-moddle/resources/camunda');

var drdAdapterModule = require('dmn-js-properties-panel/lib/adapter/drd').default,
    decisionTableAdapterModule = require('dmn-js-properties-panel/lib/adapter/decision-table').default,
    literalExpressionAdapterModule = require('dmn-js-properties-panel/lib/adapter/literal-expression').default;

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

  // update state so that it reflects that an 'input' is active
  this.on('input:focused', function(event) {
    if (isInput.isInput(event.target) && domClosest(event.target, '.dmn-editor')) {
      this.updateState();
    }
  });

  // elements to insert modeler and properties panel into
  this.$propertiesEl = domify('<div class="properties-parent"></div>');
}

inherits(DmnEditor, DiagramEditor);

module.exports = DmnEditor;

// Need to replace the method from DiagramEditor,
// so that we trigger the correct commandStack undo/redo
DmnEditor.prototype.triggerAction = function(action, options) {
  var opts = options || {};

  if ('toggleProperties' === action) {
    this.emit('layout:changed', {
      propertiesPanel: {
        open: !this.layout.propertiesPanel.open
      }
    });

    this.notifyModeler('propertiesPanel.resized');

    return;
  }

  if ('resetProperties' === action) {
    this.emit('layout:changed', {
      propertiesPanel: {
        open: false,
        width: 250
      }
    });

    this.notifyModeler('propertiesPanel.resized');

    return;
  }

  var modeler = this.getModeler();

  var activeViewer = modeler.getActiveViewer();

  if (!activeViewer) {
    return;
  }

  var editorActions = activeViewer.get('editorActions', false);

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

    if (activeView.type === 'decisionTable') {
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

    var updateState = (options = {}) => (event) => {
      this.updateState(options, event);
    };

    this.modeler.on('views.changed', updateState());

    this.modeler.on('view.contentChanged', updateState({ contentChanged: true }));

    this.modeler.on('view.selectionChanged', updateState());

    this.modeler.on('view.directEditingChanged', updateState());

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

DmnEditor.prototype.mountProperties = function(node) {
  debug('mount properties');

  node.appendChild(this.$propertiesEl);
};

DmnEditor.prototype.unmountProperties = function(node) {
  debug('unmount properties');

  node.removeChild(this.$propertiesEl);
};

DmnEditor.prototype.resizeProperties = function onDrag(panelLayout, event, delta) {

  var oldWidth = panelLayout.open ? panelLayout.width : 0;

  var newWidth = Math.max(oldWidth + delta.x * -1, 0);

  this.emit('layout:changed', {
    propertiesPanel: {
      open: newWidth > 25,
      width: newWidth
    }
  });

  this.notifyModeler('propertiesPanel.resized');
};

DmnEditor.prototype.toggleProperties = function() {

  var config = this.layout.propertiesPanel;

  this.emit('layout:changed', {
    propertiesPanel: {
      open: !config.open,
      width: !config.open ? (config.width > 25 ? config.width : 250) : config.width
    }
  });

  this.notifyModeler('propertiesPanel.resized');
};

DmnEditor.prototype.createModeler = function($el) {
  return new DmnJS({
    position: 'absolute',
    container: $el,
    drd: {
      additionalModules: [
        diagramOriginModule,
        propertiesPanelModule,
        propertiesProviderModule,
        drdAdapterModule
      ],
      propertiesPanel: {
        parent: this.$propertiesEl
      }
    },
    decisionTable: {
      additionalModules: [
        propertiesPanelModule,
        propertiesProviderModule,
        decisionTableAdapterModule
      ],
      propertiesPanel: {
        parent: this.$propertiesEl
      }
    },
    literalExpression: {
      additionalModules: [
        propertiesPanelModule,
        propertiesProviderModule,
        literalExpressionAdapterModule
      ],
      propertiesPanel: {
        parent: this.$propertiesEl
      }
    },
    common: {
      keyboard: {
        bindTo: $el
      }
    },
    moddleExtensions: {
      camunda: camundaModdlePackage
    }
  });
};

/**
 * Notify initialized modeler about an event.
 *
 * @param {String} eventName
 */
DmnEditor.prototype.notifyModeler = function(eventName) {

  var modeler = this.getModeler();

  try {
    modeler.getActiveViewer().get('eventBus').fire(eventName);
  } catch (e) {
    // we don't care
  }
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

  var layout = this.layout,
      propertiesLayout = layout.propertiesPanel;

  var propertiesStyle = {
    width: (propertiesLayout.open ? propertiesLayout.width : 0) + 'px'
  };

  var showPropertiesToggle = this.getActiveEditorName() === 'drd' || propertiesLayout.open;

  return (
    <div className="dmn-editor" key={ this.id }>
      <Loader hidden={ !!this.lastXML } />
      <div
        className="editor-container"
        onAppend={ this.compose('mountEditor') }
        onRemove={ this.compose('unmountEditor') }>
      </div>
      <div className="properties" style={ propertiesStyle } tabIndex="0">
        {
          showPropertiesToggle
            ? <div
              className="toggle"
              ref="properties-toggle"
              draggable="true"
              onClick={ this.compose('toggleProperties') }
              onDragstart={
                dragger(this.compose('resizeProperties', copy(propertiesLayout)))
              }>
              Properties Panel
            </div>
            : null
        }
        <div
          className="resize-handle"
          draggable="true"
          onDragStart={
            dragger(this.compose('resizeProperties', copy(propertiesLayout)))
          }>
        </div>
        <div
          className="properties-container"
          onAppend={ this.compose('mountProperties') }
          onRemove={ this.compose('unmountProperties') }>
        </div>
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
