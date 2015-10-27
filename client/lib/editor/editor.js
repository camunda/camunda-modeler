'use strict';

var files = require('../util/files'),
    EditorActions = require('./editorActions'),
    menuUpdater = require('./menuUpdater'),
    // workspace = require('../util/workspace'),
    // assign = require('lodash/object/assign'),
    DiagramControl = require('./diagram/control');

var onDrop = require('../util/on-drop');

var dnd;


function isInput(target) {
  return target.type === 'textarea' || target.type === 'input';
}

function modifierPressed(evt) {
  return evt.ctrlKey || evt.metaKey;
}

function Editor($scope) {

  var self = this,
      dirty = true,
      idx = 0;

  this.currentDiagram = null;
  this.diagrams = [];
  this.views = {
    diagram: true,
    xml: false
  };

  // Start listening to Browser communication
  new EditorActions(this);

  this.canUndo = function() {
    return this.currentDiagram && !!this.currentDiagram.control.canUndo;
  };

  this.canRedo = function() {
    return this.currentDiagram && !!this.currentDiagram.control.canRedo;
  };

  this.isUnsaved = function() {
    return this.currentDiagram && !!this.currentDiagram.unsaved;
  };

  this.isOpen = function() {
    return this.currentDiagram;
  };

  this.trigger = function(action, opts) {
    if (this.currentDiagram) {
      this.currentDiagram.control.editorActions.trigger(action, opts);
    }
  };

  // Caveat to get the `Modifier+A` to work with **Select Elements**
  // If we don't do this, then the html elements will be highlighted
  // and the desired behaviour won't work
  window.addEventListener('keydown', function(evt) {
    if (evt.keyCode === 65 && modifierPressed(evt) && !isInput(evt.target)) {
      evt.preventDefault();

      if (self.currentDiagram) {
        self.currentDiagram.control.editorActions.trigger('selectElements');
      }
    }
  });

  this.saveDiagram = function(diagram, options, done) {
    if (typeof options === 'function') {
      done = options;
      options = {};
    }

    function handleSaving(err, diagram) {
      if (!err) {
        diagram.control.resetEditState();
      }

      $scope.$applyAsync();

      return done(err);
    }

    diagram.control.save(function(err, xml) {
      if (err) {
        return done(err);
      } else {
        diagram.contents = xml;

        files.saveFile(diagram, options, handleSaving);
      }
    });
  };

  this.save = function(create) {
    var active = this.currentDiagram;

    if (active) {
      this.saveDiagram(active, { create: create || false }, function(err) {
        console.log(err);
      });
    }
  };

  this.newDiagram = function() {

    var diagram = {
      name: 'diagram_' + (idx++) + '.bpmn',
      path: '[unsaved]'
    };

    this.showDiagram(diagram);

    $scope.$applyAsync();
  };

  this.isActive = function(diagram) {
    return this.currentDiagram === diagram;
  };

  /**
   * Open diagram file via the editor and show it
   */
  this.openDiagram = function() {

    var self = this;

    files.openFile(function(err, file) {
      if (err) {
        return console.error(err);
      }

      self._openDiagram(file);

      $scope.$applyAsync();
    });
  };

  this._openDiagram = function(file) {
    if (file) {
      this.diagrams.push(file);
      this.showDiagram(file);

      this.persist();
    }
  };

  /**
   * Show diagram (or null)
   *
   * @param  {DiagramFile} [diagram]
   */
  this.showDiagram = function(diagram) {
    this.currentDiagram = diagram;

    var diagrams = this.diagrams;

    if (diagram) {
      if (diagrams.indexOf(diagram) === -1) {
        diagrams.push(diagram);
      }

      if (!diagram.control) {
        diagram.control = new DiagramControl(diagram);
      }

      if (dirty && diagrams.length === 1) {
        menuUpdater.enableMenus();
        dirty = false;
      }

      menuUpdater.update({
        history: [ self.canUndo(), self.canRedo() ],
        selection: diagram.control.hasSelection(),
        saving: self.isUnsaved()
      });
    }

    // Disable modeling actions when there is no open diagram
    if (!diagram && !diagrams.length) {
      menuUpdater.disableMenus();
      dirty = true;
    }

    // this.persist();
  };

  this._closeDiagram = function(diagram) {
    var diagrams = this.diagrams,
        idx = diagrams.indexOf(diagram);

    diagrams.splice(idx, 1);

    if (diagram.control) {
      diagram.control.destroy();
    }

    if (this.isActive(diagram)) {
      this.showDiagram(diagrams[idx] || diagrams[idx - 1]);
    }

    $scope.$applyAsync();
  };

  /**
   * Close the selected diagram, asking the user for
   * the unsaved action, if any.
   *
   * @param  {DiagramFile} diagram
   */
  this.closeDiagram = function(diagram) {

    var self = this;

    if (diagram.unsaved) {
      files.closeFile(diagram, function(err, diagramFile) {
        if (err) {
          return console.error(err);
        }

        self._closeDiagram(diagram);
      });
    } else {
      self._closeDiagram(diagram);
    }

    $scope.$applyAsync();
  };

  this.persist = function() {
    // workspace.save(this, function() {
    //   console.log(arguments);
    // });
  };

  this.toggleView = function(name) {
    var views = Object.keys(this.views);
    var idx = views.indexOf(name);

    this.views[ name ] = !this.views[ name ];

    if (!this.views.diagram && !this.views.xml) {
      views.splice(idx, 1);
      this.views[views[0]] = true;
    }
  };

  this.isActiveView = function(name) {
    return this.views[name];
  };

  this.init = function() {

    var self = this;

    menuUpdater.disableMenus();

    // console.debug('[editor]', 'restoring workspace');

    // workspace.restore(function(err, config) {
    //   console.debug('[editor]', 'done');
    //
    //   if (!err) {
    //     assign(self, config);
    //   }
    //
    //   var openEntry = workspace.getOpenEntry();
    //
    //   if (openEntry) {
    //     console.debug('[editor]', 'open diagram', openEntry);
    //
    //     files.loadFile(openEntry, function(err, diagram) {
    //
    //       if (!err) {
    //         self.showDiagram(diagram);
    //       }
    //
    //       $scope.$applyAsync();
    //     });
    //   } else {
    //     self.showDiagram(config.active);
    //     $scope.$applyAsync();
    //   }
    // });

    onDiagramDrop(function(err, file) {

      if (err) {
        return console.error(err);
      }

      self._openDiagram(file);

      $scope.$applyAsync();
    });

  };

  this.init();
}

Editor.$inject = [ '$scope' ];

module.exports = Editor;


function onDiagramDrop(callback) {

  // Support dropping a single file onto this app.
  dnd = onDrop('body', function(data) {
    console.log(data);

    var entry;

    for (var i = 0; i < data.items.length; i++) {
      var item = data.items[i];
      if (item.kind == 'file' && item.webkitGetAsEntry()) {
        entry = item.webkitGetAsEntry();
        break;
      }
    }

    if (entry) {
      files.loadFile(entry, callback);
    } else {
      callback(new Error('not a diagram file'));
    }
  });
}
