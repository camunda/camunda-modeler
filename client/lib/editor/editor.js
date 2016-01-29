'use strict';

var files = require('../util/files'),
    EditorActions = require('./editorActions'),
    menuUpdater = require('./menuUpdater'),
    workspace = require('../util/workspace'),
    onDrop = require('../util/onDrop'),
    isInput = require('../util/dom').isInput,
    DiagramControl = require('./diagram/control');

var assign = require('lodash/object/assign'),
    find = require('lodash/collection/find'),
    forEach = require('lodash/collection/forEach');

var emptyFn = function() {};

function modifierPressed(evt) {
  return evt.ctrlKey || evt.metaKey;
}

function isMac() {
  return window.navigator.platform === 'MacIntel';
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
        if(err) {
          console.error(err);
        }
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

      if (notation === 'bpmn') {
        menuEntriesUpdate.selection = diagram.control.hasSelection();
      }

      if (notation === 'dmn') {
        menuEntriesUpdate.selection = {
          rule: false,
          input: false,
          output: false
        };
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

  this.persist = function(callback) {
    console.debug('[editor]', 'persist workspace');
    callback = callback || emptyFn;

    workspace.save(this, callback);
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

      return self.persist(function() {
        // quit the editor after finishing persisting
        // this callback is needed to avoid race conditions
        files.quitEditor();
      });
    }

    diagram = this.unsavedDiagrams[0];

    idx = this.diagrams.indexOf(diagram);

    this.showDiagram(diagram);

    console.debug('[editor]', 'currentDiagram', diagram.name);

    $scope.$applyAsync();

    files.closeFile(diagram, function(err, savedDiagram) {
      self.unsavedDiagrams.shift();

      if (err) {
        console.error(err);
        return;
      }

      if (idx !== -1 && !savedDiagram) {
        self.diagrams.splice(idx, 1);
      }

      // keep diagram if it was saved
      if (savedDiagram) {
        self.savedDiagrams.push(savedDiagram);
      } else
      // or if it was previously saved
      if (diagram.path !== '[unsaved]') {
        self.savedDiagrams.push(diagram);
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
      if (diagram.unsaved || (diagram.path === '[unsaved]' && diagram.unsaved)) {
        self.unsavedDiagrams.push(diagram);
      } else if (!diagram.unsaved && diagram.path !== '[unsaved]'){
        self.savedDiagrams.push(diagram);
      }
    });

    hasUnsavedChanges = !!this.unsavedDiagrams.length;

    if (hasUnsavedChanges) {
      return self.saveBeforeQuit();
    }

    files.quitEditor();
  };

  this.init = function() {

    var self = this;

    onDrop('body', function(e) {
      var file = e.files[0];

      if (!file) {
        return;
      }

      files.addFile(file.path, function() {
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


  /**
   * Handles keys and keyboard shortcuts and prevents their default behavior.
   *
   * @param  {Event} evt
   */
  function handleGlobalKey(evt) {

    var diagram = self.currentDiagram,
        tool;

    var target = evt.target;

    if (!diagram) {
      return;
    }

    /**
     * Tools (keybinding)
     *
     * Lasso (L)
     * Space (S)
     * Hand (H)
     *
     * This is necessary for the time being, because in Mac OS X the A - Z
     * accelerators (keybindings) are being swallen by the renderer process
     */
    if (isMac() && !modifierPressed(evt) && !isInput(target)) {
      switch(evt.keyCode) {
        case 76:
          // Lasso tool
          tool = 'lassoTool'
          break;
        case 83:
          // Space tool
          tool = 'spaceTool'
          break;
        case 72:
          // Hand tool
          tool = 'handTool'
          break;
        default:
        // do nothing
      }

      if (tool) {
        evt.preventDefault();

        diagram.control.trigger(tool);
      }
    }

    if (!modifierPressed(evt)) {
      return;
    }

    /**
     * Select all
     * MOD + A
     *
     * Caveat to get the 'Modifier+A' to work with 'Select Elements'
     * If we don't do this, then the html elements will be highlighted
     * and the desired behaviour won't work.
     */
    if (evt.keyCode === 65 && !isInput(target)) {
      evt.preventDefault();

      diagram.control.trigger('selectElements');
    }

    /**
     * Undo
     * MOD + Z
     *
     * Get 'Modifier+Z' to work with 'Undo'. This is needed to prevent
     * undesired behavior if for example a text field is selected.
     * This only applies to shortcuts without a pressed shift key, otherwise
     * it would also react to MOD + SHIFT + Z which triggers 'Redo'.
     */
    if (evt.keyCode === 90 && !evt.shiftKey) {
      evt.preventDefault();

      diagram.control.trigger('undo');
    }

    /**
     * Redo
     * MOD + Y
     *
     * Get 'Modifier+Y' to work with 'Redo'. This is needed to prevent
     * undesired behavior if for example a text field is selected.
     */
    if (evt.keyCode === 89) {
      evt.preventDefault();

      diagram.control.trigger('redo');
    }

    /**
     * Redo
     * MOD + SHIFT + Z
     *
     * Get 'Modifier+Shift+Z' to work with 'Redo'. This is needed to prevent
     * undesired behavior if for example a text field is selected.
     */
    if (evt.keyCode === 90 && evt.shiftKey) {
      evt.preventDefault();

      diagram.control.trigger('redo');
    }

    /**
     * Zoom In
     * MOD + NUMPAD PLUS
     *
     * Get 'Modifier+NumpadPlus' to work with 'Zoom In'
     * This is needed to trigger zooming in addition to the regular
     * plus key on the keyboard.
     */
    if (evt.keyCode === 107 && modifierPressed(evt)) {
      evt.preventDefault();

      diagram.control.trigger('stepZoom', { value: 1 });
    }

    /**
     * Zoom Out
     * MOD + NUMPAD MINUS
     *
     * Get 'Modifier+NumpadMinus' to work with 'Zoom Out'
     * This is needed to trigger zooming in addition to the regular
     * minus key on the keyboard.
     */
    if (evt.keyCode === 109 && modifierPressed(evt)) {
      evt.preventDefault();

      diagram.control.trigger('stepZoom', { value: -1 });
    }
  }

  // hook into global short cuts
  window.addEventListener('keydown', handleGlobalKey);

  $scope.$on('$destroy', function() {
    window.removeEventListener('keydown', handleGlobalKey);
  });
}

Editor.$inject = [ '$scope' ];

module.exports = Editor;
