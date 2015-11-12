'use strict';

var files = require('../util/files'),
    EditorActions = require('./editorActions'),
    menuUpdater = require('./menuUpdater'),
    workspace = require('../util/workspace'),
    onDrop = require('../util/onDrop'),
    DiagramControl = require('./diagram/control');

var assign = require('lodash/object/assign'),
    find = require('lodash/collection/find'),
    forEach = require('lodash/collection/forEach');


function isInput(target) {
  return target.type === 'textarea' || target.type === 'input';
}

function modifierPressed(evt) {
  return evt.ctrlKey || evt.metaKey;
}

function Editor($scope) {

  var self = this,
      dirty = false;

  this.idx = 0;
  this.currentDiagram = null;
  this.diagrams = [];
  this.views = {
    diagram: true,
    xml: false,
  };
  this.propertiesPanel = {
    open: true
  };

  // Start listening to Browser communication
  this.editorActions = new EditorActions(this);

  this.canUndo = function() {
    return this.currentDiagram && !!this.currentDiagram.control.canUndo;
  };

  this.canRedo = function() {
    return this.currentDiagram && !!this.currentDiagram.control.canRedo;
  };

  this.isUnsaved = function() {
    return this.currentDiagram && !!this.currentDiagram.unsaved;
  };

  this.isPropertiesPanelOpen = function() {
    return this.propertiesPanel.open;
  };

  this.hasProperties = function(diagram) {
    return diagram.notation === 'bpmn';
  };

  this.togglePropertiesPanel = function() {
    this.propertiesPanel.open = !this.propertiesPanel.open;
    this.persist();
  };

  this.isOpen = function() {
    return this.currentDiagram;
  };

  this.trigger = function(action, opts) {
    if (this.currentDiagram) {
      this.currentDiagram.control.trigger(action, opts);
    }
  };

  this.saveDiagram = function(diagram, options, done) {
    var self = this;

    if (typeof options === 'function') {
      done = options;
      options = {};
    }

    function handleSaving(err, diagram) {
      if (!err) {
        diagram.control.resetEditState();
      }

      self.persist();

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

  this.newDiagram = function(notation) {

    var diagram = {
      name: 'diagram_' + (this.idx++) + '.' + notation,
      path: '[unsaved]',
      notation: notation
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

      self.addDiagram(file);
    });
  };

  this.addDiagram = function(file) {

    var existingDiagram;

    if (file) {

      existingDiagram = find(this.diagrams, function(d) {
        return d.path === file.path;
      });

      if (existingDiagram) {
        this.showDiagram(existingDiagram);
      } else {
        this.diagrams.push(file);
        this.showDiagram(file);
      }

      $scope.$applyAsync();
    }
  };

  /**
   * Show diagram (or null)
   *
   * @param  {DiagramFile} [diagram]
   */
  this.showDiagram = function(diagram) {
    var menuEntriesUpdate = {},
        diagrams,
        notation;

    if (!this.isActive(diagram)) {
      this.currentDiagram = diagram;

      this.persist();
    }

    diagrams = this.diagrams;

    if (diagram) {
      notation = diagram.notation;

      if (diagrams.indexOf(diagram) === -1) {
        diagrams.push(diagram);
      }

      if (!diagram.control) {
        diagram.control = new DiagramControl(diagram);
      }

      if (!dirty && diagrams.length >= 1) {
        menuUpdater.enableMenus();
        dirty = true;
      }

      menuEntriesUpdate = {
        history: [ self.canUndo(), self.canRedo() ],
        saving: self.isUnsaved()
      };

      if (diagram.notation === 'bpmn') {
        menuEntriesUpdate.selection = diagram.control.hasSelection();
      }

      menuUpdater.update(notation, menuEntriesUpdate);
    }

    // Disable modeling actions when there is no open diagram
    if (!diagrams.length) {
      menuUpdater.disableMenus();
      dirty = false;
    }
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
    } else {
      this.persist();
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
    workspace.save(this, function() {
      console.debug('[editor]', 'persist workspace');
    });
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


  this.saveBeforeQuit = function() {
    var self = this,
        idx,
        diagram;

    if (this.unsavedDiagrams.length === 0) {
      this.diagrams = this.savedDiagrams;

      self.persist();

      return files.quit(false);
    }

    diagram = this.unsavedDiagrams[0];

    idx = this.diagrams.indexOf(diagram);

    this.currentDiagram = diagram;

    console.debug('[editor]', 'currentDiagram', diagram);

    $scope.$applyAsync();

    files.saveFile(diagram, { create: true }, function(err, savedDiagram) {
      self.unsavedDiagrams.shift();

      if (idx !== -1) {
        self.diagrams.splice(idx, 1);
      }

      if (!err) {
        self.savedDiagrams.push(savedDiagram);
      }

      self.saveBeforeQuit();
    });
  };

  this.quit = function() {
    var self = this,
        hasUnsavedChanges;

    this.unsavedDiagrams = [];
    this.savedDiagrams = [];

    forEach(this.diagrams, function(diagram) {
      if (diagram.path === '[unsaved]' || diagram.unsaved) {
        self.unsavedDiagrams.push(diagram);
      } else{
        self.savedDiagrams.push(diagram);
      }
    });

    forEach(self.savedDiagrams, function(diagram) {
      var idx = self.diagrams.indexOf(diagram);

      if (idx !== -1) {
        self.diagrams.splice(idx, 1);
      }
    });

    hasUnsavedChanges = !!this.unsavedDiagrams.length;

    files.quit(hasUnsavedChanges, function(err, answer) {
      if (err) {
        return console.error(err);
      }

      if (answer !== 'save') {
        return;
      }

      console.debug('[editor]', 'quit');

      self.saveBeforeQuit();
    });
  };

  this.init = function() {

    var self = this;

    onDrop('body', function(e) {
      files.addFile(e.files[0].path, function() {
        // do nothing
      });
    });

    workspace.restore(function(err, config) {
      console.debug('[editor]', 'restoring workspace', config);

      if (err) {
        return console.error(err);
      }

      assign(self, config);

      if (config.currentDiagram) {
        console.debug('[editor]', 'open diagram', config.currentDiagram);

        self.showDiagram(config.currentDiagram);
      } else {
        setTimeout(function() {
          menuUpdater.disableMenus();
        }, 100);
      }

      if (config.propertiesPanel) {
        self.propertiesPanel = config.propertiesPanel;
      }

      $scope.$applyAsync();
    });
  };

  this.init();


  function handleGlobalKey(evt) {

    // Caveat to get the `Modifier+A` to work with **Select Elements**
    // If we don't do this, then the html elements will be highlighted
    // and the desired behaviour won't work

    var diagram = self.currentDiagram;

    if (!diagram || isInput(evt.target) || !modifierPressed(evt)) {
      return;
    }

    if (evt.keyCode === 65) { // MOD + A
      evt.preventDefault();

      diagram.control.trigger('selectElements');
    }

    if (evt.keyCode === 90 && evt.shiftKey) { // MOD + SHIFT + Z
      evt.preventDefault();

      diagram.control.trigger('redo');
    }
  }

  // hook into global short cuts for fixing Modifier+A (select all)
  // and allowing Modifier+SHIFT+Z (redo)
  window.addEventListener('keydown', handleGlobalKey);

  $scope.$on('$destroy', function() {
    window.removeEventListener('keydown', handleGlobalKey);
  });
}

Editor.$inject = [ '$scope' ];

module.exports = Editor;
