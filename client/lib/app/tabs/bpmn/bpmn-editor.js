'use strict';

var inherits = require('inherits');

var DiagramEditor = require('../../editor/diagram-editor');

var BpmnJS = require('bpmn-js/lib/Modeler');

var diagramOriginModule = require('diagram-js-origin'),
    propertiesPanelModule = require('bpmn-js-properties-panel'),
    propertiesProviderModule = require('bpmn-js-properties-panel/lib/provider/camunda'),
    camundaModdlePackage = require('camunda-bpmn-moddle/resources/camunda');

var domify = require('domify');

var dragger = require('util/dom/dragger');

var debug = require('debug')('bpmn-editor');

var copy = require('util/copy');


/**
 * A BPMN 2.0 diagram editing component.
 *
 * @param {Object} options
 */
function BpmnEditor(options) {

  DiagramEditor.call(this, options);

  // elements to insert modeler and properties panel into
  this.$propertiesEl = domify('<div class="properties-parent"></div>');
}

inherits(BpmnEditor, DiagramEditor);

module.exports = BpmnEditor;


BpmnEditor.prototype.updateState = function() {

  var modeler = this.getModeler(),
      commandStack,
      lastStackIndex = this.lastStackIndex;

  var stateContext = {};

  // no diagram to harvest, good day maam!
  if (isImported(modeler)) {
    commandStack = modeler.get('commandStack');

    // TODO(nikku): complete / more updates?
    stateContext = {
      undo: commandStack.canUndo(),
      redo: commandStack.canRedo(),
      dirty: commandStack._stackIdx !== lastStackIndex
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
      'selection.changed',
      'import.success',
      'import.error'
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
      warnings;

  var propertiesStyle = {
    width: (propertiesLayout.open ? propertiesLayout.width : 0) + 'px'
  };

  if (this.warnings) {
    warnings = (
      <div className="bpmn-warnings">
        There are {this.warnings.length} warnings!
        <button onClick={ this.compose('showWarnings')}>Show XML</button>
        <button onClick={ this.compose('closeWarningsOverlay')}>x</button>
      </div>
    );
  }

  return (
    <div className="bpmn-editor" key={ this.id + '#bpmn' }>
      <div className="diagram-container"
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
      {warnings}
    </div>
  );
};


function isImported(modeler) {
  return !!modeler.definitions;
}