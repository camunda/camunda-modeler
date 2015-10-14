'use strict';

var files = require('../util/filesElectron'),
    // workspace = require('../util/workspace'),
    // assign = require('lodash/object/assign'),
    DiagramControl = require('./diagram/control');

var onDrop = require('../util/on-drop');

var dnd;

function Editor($scope, dialog) {

  var idx = 0;

  this.currentDiagram = null;
  this.diagrams = [];
  this.views = {
    diagram: true,
    xml: false
  };

  this.canUndo = function() {
    return this.currentDiagram && this.currentDiagram.control.canUndo;
  };

  this.canRedo = function() {
    return this.currentDiagram && this.currentDiagram.control.canRedo;
  };

  this.isUnsaved = function() {
    return this.currentDiagram && this.currentDiagram.unsaved;
  };

  this.isOpen = function() {
    return this.currentDiagram;
  };

  this.undo = function() {
    if (this.currentDiagram) {
      this.currentDiagram.control.undo();
    }
  };

  this.redo = function() {
    if (this.currentDiagram) {
      this.currentDiagram.control.redo();
    }
  };

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
      dialog.confirm('Save changes to ' + diagram.name + ' before closing?', {
        cancel: { label: 'Cancel' },
        close: { label: 'Don\'t Save'},
        save: { label: 'Save', defaultAction: true }
      }, function(result) {
        if (result === 'save') {
          self.saveDiagram(diagram, function(err) {
            self._closeDiagram(diagram);
          });
        }

        if (result === 'close') {
          self._closeDiagram(diagram);
        }
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

    function modifierPressed(event) {
      return event.metaKey || event.ctrlKey;
    }

    document.addEventListener('keydown', function(e) {

      if (!modifierPressed(e)) {
        return;
      }

      // save - 83 (S) + meta/ctrl
      if (e.keyCode === 83) {
        e.preventDefault();
        self.save();
      }

      // save as - 83 (S) + meta/ctrl + shift
      if (e.keyCode === 83 && e.shiftKey) {
        e.preventDefault();
        self.save(true);
      }

      // open - 79 (O) + meta/ctrl
      if (e.keyCode === 79) {
        e.preventDefault();
        self.openDiagram();
      }

      // new diagram - (T/N) 84 + meta/ctrl
      if (e.keyCode === 84 || e.keyCode === 78) {
        e.preventDefault();
        self.newDiagram();
      }

      // close tab - (W) - 87 + meta/ctrl
      if (e.keyCode === 87 && self.currentDiagram) {
        e.preventDefault();
        self.closeDiagram(self.currentDiagram);
      }
    });
  };

  this.init();
}

Editor.$inject = [ '$scope', 'dialog' ];

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
