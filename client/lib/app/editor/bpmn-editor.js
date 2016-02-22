'use strict';

var inherits = require('inherits');

var DiagramEditor = require('./diagram-editor');

var CloseHandle = require('base/components/misc/close-handle');

var BpmnJS = require('bpmn-js/lib/Modeler');

var diagramOriginModule = require('diagram-js-origin'),
    propertiesPanelModule = require('bpmn-js-properties-panel'),
    propertiesProviderModule = require('bpmn-js-properties-panel/lib/provider/camunda'),
    camundaModdlePackage = require('camunda-bpmn-moddle/resources/camunda');

var domify = require('domify');

var dragger = require('util/dom/dragger');

var debug = require('debug')('bpmn-editor');

var ensureOpts = require('util/ensure-opts');

var copy = require('util/copy');


/**
 * A BPMN 2.0 diagram editing component.
 *
 * @param {Object} options
 */
function BpmnEditor(options) {

  ensureOpts([ 'layout' ], options);

  DiagramEditor.call(this, options);

  // elements to insert modeler and properties panel into
  this.$propertiesEl = domify('<div class="properties-parent"></div>');

  this.on('imported', (context) => {

    var xml = context.xml;

    var initialState = this.initialState;

    // we are back at start, unset reimport flag
    if (xml === initialState.xml) {
      initialState.reimported = false;
    } else

    // reimport, we are going to be dirty always
    if ('stackIndex' in initialState) {
      initialState.reimported = true;
    }

    initialState.stackIndex = -1;
  });

  this.on('updated', (ctx) => {

    var modeler = this.modeler,
        initialState = this.initialState;

    // log stack index on first imported
    // update after loading
    if (isImported(modeler) && !('stackIndex' in initialState)) {
      initialState.stackIndex = this.getStackIndex();
    }

    // on updated, update state and emit <shown> event
    this.updateState();

    this.emit('shown', ctx);
  });

}

inherits(BpmnEditor, DiagramEditor);

module.exports = BpmnEditor;


BpmnEditor.prototype.updateState = function() {

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

    // TODO(nikku): complete / more updates?
    stateContext = {
      undo: commandStack.canUndo(),
      redo: commandStack.canRedo(),
      dirty: dirty
    };
  }

  this.emit('state-updated', stateContext);
};

BpmnEditor.prototype.getStackIndex = function() {
  var modeler = this.getModeler();

  return isImported(modeler) ? modeler.get('commandStack')._stackIdx : -1;
};

BpmnEditor.prototype.mountProperties = function(node) {
  debug('mount properties');

  node.appendChild(this.$propertiesEl);
};

BpmnEditor.prototype.unmountProperties = function(node) {
  debug('unmount properties');

  node.removeChild(this.$propertiesEl);
};

BpmnEditor.prototype.resizeProperties = function onDrag(panelLayout, event, delta) {

  var oldWidth = panelLayout.open ? panelLayout.width : 0;

  var newWidth = Math.max(oldWidth + delta.x * -1, 0);

  this.emit('layout:changed', {
    propertiesPanel: {
      open: newWidth > 25,
      width: newWidth
    }
  });
};

BpmnEditor.prototype.toggleProperties = function() {

  var config = this.layout.propertiesPanel;

  this.emit('layout:changed', {
    propertiesPanel: {
      open: !config.open,
      width: !config.open ? (config.width > 25 ? config.width : 250) : config.width
    }
  });
};

BpmnEditor.prototype.triggerAction = function(action, options) {

  var modeler = this.getModeler();

  if (action === 'undo') {
    modeler.get('commandStack').undo();
  }

  if (action === 'redo') {
    modeler.get('commandStack').redo();
  }
};

BpmnEditor.prototype.getModeler = function() {

  if (!this.modeler) {

    // lazily instantiate and cache
    this.modeler = this.createModeler(this.$el, this.$propertiesEl);

    // hook up with modeler change events
    this.modeler.on([
      'commandStack.changed',
      'selection.changed'
    ], this.updateState, this);
  }

  return this.modeler;
};


BpmnEditor.prototype.createModeler = function($el, $propertiesEl) {

  var propertiesPanelConfig = {
    'config.propertiesPanel': [ 'value', { parent: $propertiesEl } ]
  };

  return new BpmnJS({
    container: $el,
    position: 'absolute',
    additionalModules: [
      diagramOriginModule,
      propertiesPanelModule,
      propertiesProviderModule,
      propertiesPanelConfig
    ],
    moddleExtensions: { camunda: camundaModdlePackage }
  });
};

BpmnEditor.prototype.render = function() {

  var propertiesLayout = this.layout.propertiesPanel,
      warningsOverlay;

  var propertiesStyle = {
    width: (propertiesLayout.open ? propertiesLayout.width : 0) + 'px'
  };

  var warnings = getWarnings(this.lastImport);

  if (warnings) {

    warningsOverlay = (
      <div className="warnings-overlay bpmn-warnings" ref="warnings-overlay">
        <div className="alert">
          Imported with { warningsStr(warnings) }.&nbsp;

          <a href onClick={ this.compose('showWarnings') } ref="warnings-details-link">Show Details</a>.

          <CloseHandle onClick={ this.compose('hideWarnings') } ref="warnings-hide-link" />
        </div>
      </div>
    );
  }

  return (
    <div className="bpmn-editor" key={ this.id + '#bpmn' }>
      <div className="editor-container"
           tabIndex="0"
           onAppend={ this.compose('mountEditor') }
           onRemove={ this.compose('unmountEditor') }>
      </div>
      <div className="properties" style={ propertiesStyle } tabIndex="0">
        <div className="toggle"
             ref="properties-toggle"
             draggable="true"
             onClick={ this.compose('toggleProperties') }
             onDragstart={ dragger(this.compose('resizeProperties', copy(propertiesLayout))) }>
          Properties Panel
        </div>
        <div className="properties-container"
             onAppend={ this.compose('mountProperties') }
             onRemove={ this.compose('unmountProperties') }>
        </div>
      </div>
      { warningsOverlay }
    </div>
  );
};


BpmnEditor.prototype.showWarnings = function() {

  var warnings = getWarnings(this.lastImport);

  if (!warnings) {
    return;
  }

  var messages = warnings.map(function(warning) {
    return [ 'warn', '> ' + warning.message ];
  });

  // prepend summary message
  messages.unshift([ 'warn', 'Imported BPMN diagram with ' + warningsStr(warnings) ]);
  messages.unshift([ 'warn', ' ' ]);

  this.emit('log', messages);
};

BpmnEditor.prototype.hideWarnings = function() {
  this.lastImport = null;

  this.emit('changed');
};

function isImported(modeler) {
  return !!modeler.definitions;
}


function warningsStr(warnings) {
  var count = warnings.length;

  return count + ' warning' + (count !== 1 ? 's' : '');
}


function getWarnings(lastImport) {
  var warnings = lastImport && lastImport.warnings;

  return warnings && warnings.length ? warnings : null;
}