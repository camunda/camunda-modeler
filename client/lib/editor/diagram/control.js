var domify = require('min-dom/lib/domify');

var BpmnJS = require('bpmn-js/lib/Modeler'),
    DiagramJsOrigin = require('diagram-js-origin');


function createBpmnJS(element) {
  return new BpmnJS({
    container: element,
    position: 'absolute',
    additionalModules: [
      DiagramJsOrigin
    ]
  });
}


function DiagramControl(diagramFile) {

  var $el = domify('<div>'),
      modeler = this.modeler = createBpmnJS($el);

  var self = this;

  var commandStackIdx = -1,
      attachedScope;

  function apply() {
    if (attachedScope) {
      attachedScope.$applyAsync();
    }
  }

  function imported(err, warnings) {
    console.log(arguments);

    var canvas = modeler.get('canvas');

    if (self.viewbox) {
      canvas.viewbox(self.viewbox);
    }

    self.attachKeyboard();
  }

  modeler.on('commandStack.changed', function(e) {
    var commandStack = modeler.get('commandStack');

    self.canUndo = commandStack.canUndo();
    self.canRedo = commandStack.canRedo();

    diagramFile.unsaved = (commandStackIdx !== commandStack._stackIdx);
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

  this.attachKeyboard = function() {
    var keyboard = modeler.get('keyboard');

    keyboard.bind(document);
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

    element.appendChild($el);

    if (!modeler.diagram) {
      if (diagramFile.contents) {
        modeler.importXML(diagramFile.contents, imported);
      } else {
        modeler.createDiagram(imported);
      }
    } else {
      self.attachKeyboard();
    }
  };

  this.detach = function() {
    var parent = $el.parentNode,
        keyboard = modeler.get('keyboard');

    if (parent) {
      attachedScope = null;
      parent.removeChild($el);
    }

    keyboard.unbind();
  };

  this.undo = function() {
    modeler.get('commandStack').undo();
  };

  this.redo = function() {
    modeler.get('commandStack').redo();
  };

  this.destroy = function() {
    modeler.destroy();
  };
}


module.exports = DiagramControl;
