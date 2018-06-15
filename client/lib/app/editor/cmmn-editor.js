'use strict';

var inherits = require('inherits');

var Loader = require('./loader');

import {
  assign
} from 'min-dash';

import {
  domify,
  closest as domClosest
} from 'min-dom';

var DiagramEditor = require('./diagram-editor');

var CmmnJS = require('cmmn-js/lib/Modeler');

var DiagramJSOrigin = require('diagram-js-origin').default,
    propertiesPanelModule = require('cmmn-js-properties-panel'),
    propertiesProviderModule = require('cmmn-js-properties-panel/lib/provider/camunda'),
    camundaModdlePackage = require('camunda-cmmn-moddle/resources/camunda');

var WarningsOverlay = require('base/components/warnings-overlay');

var getWarnings = require('app/util/get-warnings');

var ensureOpts = require('util/ensure-opts'),
    dragger = require('util/dom/dragger'),
    isInput = require('util/dom/is-input'),
    isInputActive = isInput.active,
    copy = require('util/copy');

var generateImage = require('app/util/generate-image');

var debug = require('debug')('cmmn-editor');


/**
 * A CMMN 1.1 diagram editing component.
 *
 * @param {Object} options
 */
function CmmnEditor(options) {

  ensureOpts([
    'layout',
    'config',
    'metaData'
  ], options);

  DiagramEditor.call(this, options);

  this.name = 'cmmn';

  // set current modeler version and name to the diagram
  this.on('save', () => {
    var definitions = this.getModeler().getDefinitions();

    if (definitions) {
      definitions.exporter = options.metaData.name;
      definitions.exporterVersion = options.metaData.version;
    }
  });

  // update state so that it reflects that an 'input' is active
  this.on('input:focused', function(event) {
    if (isInput.isInput(event.target) && domClosest(event.target, '.cmmn-editor')) {
      this.updateState();
    }
  });

  // elements to insert modeler and properties panel into
  this.$propertiesEl = domify('<div class="properties-parent"></div>');
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


  if ('zoomFit' === action) {
    action = 'zoom';

    opts = assign({
      value: 'fit-viewport'
    }, options);
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
      elementsSelected: elementsSelected,
      dirty: dirty,
      zoom: true,
      editable: true,
      inactiveInput: !inputActive
    });
  }

  this.emit('state-updated', stateContext);
};


CmmnEditor.prototype.mountProperties = function(node) {
  debug('mount properties');

  node.appendChild(this.$propertiesEl);
};

CmmnEditor.prototype.unmountProperties = function(node) {
  debug('unmount properties');

  node.removeChild(this.$propertiesEl);
};

CmmnEditor.prototype.resizeProperties = function onDrag(panelLayout, event, delta) {

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

CmmnEditor.prototype.toggleProperties = function() {

  var config = this.layout.propertiesPanel;

  this.emit('layout:changed', {
    propertiesPanel: {
      open: !config.open,
      width: !config.open ? (config.width > 25 ? config.width : 250) : config.width
    }
  });

  this.notifyModeler('propertiesPanel.resized');
};

CmmnEditor.prototype.getModeler = function() {

  if (!this.modeler) {

    // lazily instantiate and cache
    this.modeler = this.createModeler(this.$el, this.$propertiesEl);

    // hook up with modeler change events
    this.modeler.on([
      'commandStack.changed',
      'selection.changed',
      'directEditing.activate',
      'directEditing.deactivate'
    ], this.updateState, this);

    // add importing flag (high priority)
    this.modeler.on('import.parse.start', 1500, () => {
      this.initialState.importing = true;
    });

    // remove importing flag (high priority)
    this.modeler.on('import.done', 1500, () => {
      this.initialState.importing = false;
    });

    // log errors into log
    this.modeler.on('error', 1500, ({ error }) => {
      this.emit('log', [
        [ 'error', error.stack ]
      ]);
      this.emit('log:toggle', { open: true });
    });
  }

  return this.modeler;
};


CmmnEditor.prototype.createModeler = function($el, $propertiesEl) {

  var propertiesPanelConfig = {
    'config.propertiesPanel': [ 'value', { parent: $propertiesEl } ]
  };

  return new CmmnJS({
    container: $el,
    position: 'absolute',
    additionalModules: [
      DiagramJSOrigin,
      propertiesPanelModule,
      propertiesProviderModule,
      propertiesPanelConfig
    ],
    moddleExtensions: { camunda: camundaModdlePackage }
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


// trigger the palette resizal whenever we focus a tab or the layout is updated
CmmnEditor.prototype.resize = function() {
  var modeler = this.getModeler(),
      canvas = modeler.get('canvas');

  canvas.resized();
};


CmmnEditor.prototype.render = function() {

  var propertiesLayout = this.layout.propertiesPanel;

  var propertiesStyle = {
    width: (propertiesLayout.open ? propertiesLayout.width : 0) + 'px'
  };

  var warnings = getWarnings(this.lastImport);

  return (
    <div
      className="cmmn-editor"
      key={ this.id + '#cmmn' }
      onFocusin={ this.compose('updateState') }>
      <Loader hidden={ !!this.lastXML } />
      <div
        className="editor-container"
        onAppend={ this.compose('mountEditor') }
        onRemove={ this.compose('unmountEditor') }>
      </div>
      <div className="properties" style={ propertiesStyle } tabIndex="0">
        <div
          className="toggle"
          ref="properties-toggle"
          draggable="true"
          onClick={ this.compose('toggleProperties') }
          onDragstart={ dragger(this.compose('resizeProperties', copy(propertiesLayout))) }>
          Properties Panel
        </div>
        <div
          className="resize-handle"
          draggable="true"
          onDragStart={ dragger(this.compose('resizeProperties', copy(propertiesLayout))) }></div>
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

/**
 * Notify initialized modeler about an event.
 *
 * @param {String} eventName
 */
CmmnEditor.prototype.notifyModeler = function(eventName) {

  var modeler = this.getModeler();

  try {
    modeler.get('eventBus').fire(eventName);
  } catch (e) {
    // we don't care
  }
};

function isImported(modeler) {
  return modeler.getDefinitions();
}
