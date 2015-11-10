'use strict';

var is = require('bpmn-js/lib/util/ModelUtil').is;

var menuUpdater = require('../menuUpdater'),
    files = require('../../util/files');

var createModeler = require('./modeler');

var domify = require('min-dom/lib/domify');


function isNotation(diagram, notation) {
  return diagram.notation && diagram.notation === notation;
}


function DiagramControl(diagramFile) {
  var self = this;

  var $el = domify('<div class="container">'),
      $propertiesEl = domify('<div class="container">');

  console.debug('[control]', diagramFile);

  var modeler = createModeler(diagramFile.notation, $el, $propertiesEl);

  var commandStackIdx = -1,
      attachedScope;

  function apply() {
    if (attachedScope) {
      attachedScope.$applyAsync();
    }
  }

  function imported(err, warnings) {
    var canvas;

    if (err) {
      return self.handleImportError(err.message);
    }

    if (isNotation(diagramFile, 'bpmn')) {
      canvas = modeler.get('canvas');

      if (self.viewbox) {
        canvas.viewbox(self.viewbox);
      }

      self.modelerActions = modeler.get('editorActions');
    }
  }

  modeler.on('selection.changed', function(evt) {
    var elements,
        hasSelection,
        enabled;

    if (!isNotation(diagramFile, 'bpmn')) {
      return;
    }

    elements = modeler.get('selection').get();
    hasSelection = !!elements.length;
    enabled = false;

    if ((elements.length === 1 &&
       !(is(elements[0], 'bpmn:Process') || is(elements[0], 'bpmn:Collaboration'))) ||
       elements.length > 1) {
      enabled = true;
    }

    menuUpdater.update(diagramFile.type, {
      selection: hasSelection
    });
  });

  modeler.on('commandStack.changed', function(e) {
    var commandStack = modeler.get('commandStack');

    self.canUndo = commandStack.canUndo();
    self.canRedo = commandStack.canRedo();

    diagramFile.unsaved = (commandStackIdx !== commandStack._stackIdx);

    menuUpdater.update(diagramFile.type, {
      history: [ self.canUndo, self.canRedo ],
      saving: diagramFile.unsaved
    });
  });

  modeler.on('commandStack.changed', apply);

  this.saveViewbox = function (event) {
    event.preventDefault();
    self.viewbox = event.viewbox;
  };

  modeler.on('canvas.viewbox.changed', this.saveViewbox);

  this.resetEditState = function() {
    var commandStack = modeler.get('commandStack');

    commandStackIdx = commandStack._stackIdx;

    diagramFile.unsaved = false;
  };

  this.redrawDiagram = function() {
    if (self.xml !== diagramFile.contents) {
      modeler.importXML(self.xml, imported);

      diagramFile.unsaved = true;
    }
  };

  this.save = function(done) {
    modeler.saveXML({ format: true }, function(err, xml) {
      if (typeof done === 'function') {
        done(err, xml);
      }

      self.xml = diagramFile.contents = xml;

      apply();
    });
  };

  modeler.on('import.success', this.save);

  modeler.on('commandStack.changed', this.save);

  this.attach = function(scope, element) {
    attachedScope = scope;

    element.querySelector('.bio-canvas').appendChild($el);
    element.querySelector('.bio-properties-panel').appendChild($propertiesEl);

    if (!modeler.diagram) {
      if (diagramFile.contents) {
        modeler.importXML(diagramFile.contents, imported);
      } else {
        modeler.createTemplate(imported);
      }
    }
  };

  this.detach = function() {
    var $elParent = $el.parentNode;

    if ($elParent) {
      attachedScope = null;
      $elParent.removeChild($el);
      $propertiesEl.parentNode.removeChild($propertiesEl);
    }
  };

  this.hasSelection = function() {
    try {
      var selection = modeler.get('selection');
      return !!selection.get().length;
    } catch (e) {
      return false;
    }
  };

  this.destroy = function() {
    modeler.destroy();
  };

  this.handleImportError = function(message) {
    files.importError(message, function(err) {
      console.error('[import error]', err);
    });
  };
}


module.exports = DiagramControl;
