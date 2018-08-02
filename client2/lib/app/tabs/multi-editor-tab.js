'use strict';

var debug = require('debug')('multi-editor-tab');

var inherits = require('inherits');

var h = require('vdom/h');

var isUnsaved = require('util/file/is-unsaved'),
    replaceFileExt = require('util/file/replace-file-ext'),
    ensureOpts = require('util/ensure-opts');

var Tab = require('base/components/tab');

import {
  assign,
  find,
  matchPattern
} from 'min-dash';

/**
 * A tab holding a number of editors for a given file.
 *
 * @param {Object} options
 */
function MultiEditorTab(options) {

  ensureOpts([
    // externals / communication structure
    // communicate via events not this.emit :'-(
    'events',
    'dialog',
    // editor tab definition (file is optional)
    'id',
    'editorDefinitions'
  ], options);

  Tab.call(this, options);

  this.editors = this.createEditors(options);

  this.setEditor(this.editors[0]);

  // initialize with passed file, if any
  if (options.file) {
    this.setFile(options.file);
  }

  this.on('focus', () => {

    if (!this.activeEditor && this.editors.length) {
      this.showEditor(this.editors[0]);
    } else {
      this.activeEditor.update();
    }

    this.activeEditor.emit('focus');
  });

  this.on('destroy', () => {

    if (this.editors) {
      this.editors.forEach(function(editor) {
        editor.destroy();
      });
    }

    this._globalListeners.forEach((gl) => {
      this.events.removeListener(gl.eventName, gl.callback);
    });

    this._globalListeners = [];
  });
}

inherits(MultiEditorTab, Tab);

module.exports = MultiEditorTab;


/**
 * Export the tab contents as the given type.
 *
 * Type can be any of png|svg|... depending on what
 * the currently active underlying editor supports.
 *
 * @param {String} type
 * @param {Function} done to be invoked with (err, exportedFile)
 */
MultiEditorTab.prototype.exportAs = function(type, done) {

  var activeEditor = this.activeEditor;

  if (!activeEditor.exportAs) {
    return done(unsupportedExportAs());
  }

  activeEditor.exportAs(type, (err, newFile) => {

    if (err) {
      this.logger.error('%s', err.message);

      return done(err);
    }

    done(null, assign({}, newFile, withExtension(this.file, type)));
  });
};

/**
 * Show a contained editor by editor id or direct reference.
 *
 * @param  {String|BaseEditor} editor
 */
MultiEditorTab.prototype.showEditor = function(editor) {

  if (typeof editor === 'string') {
    editor = this.getEditor(editor);
  }

  var newEditor = editor,
      oldEditor = this.activeEditor;

  // no need to switch editors, if same
  if (newEditor === oldEditor) {
    return;
  }

  debug('[#showEditor] %s', newEditor.id);

  // export old editor contents
  oldEditor.saveXML((err, xml) => {

    if (err) {
      debug('[#showEditor] editor export error %s', err);

      this.dialog.exportError(err, function() {});

      return;
    }

    this.switchEditor(newEditor, xml);
  });
};

MultiEditorTab.prototype.switchEditor = function(newEditor, xml) {
  // set new editor
  this.setEditor(newEditor);

  // sync XML contents
  newEditor.setXML(xml);
};

/**
 * Get an editor by editor id.
 *
 * @param {String|BaseEditor} id
 *
 * @return {BaseEditor}
 */
MultiEditorTab.prototype.getEditor = function(id) {
  var editor;

  if (typeof id === 'string') {
    editor = find(this.editors, matchPattern({
      id: this.id + '#' + id
    }));
  } else {
    editor = id;
  }

  if (!editor) {
    throw new Error('no editor ' + id);
  }

  return editor;
};

// TODO(nikku): <REALLY BAD NAME....> we are going to set the _ACTIVE_ editor here

MultiEditorTab.prototype.setEditor = function(editor) {
  this.activeEditor = editor;

  this.emit('focus');

  this.events.emit('changed');
};

/**
 * Create and wire the editors this tab consists of.
 *
 * @param {Object} options
 *
 * @return {Array<Object>} editors
 */
MultiEditorTab.prototype.createEditors = function(options) {
  debug('create editors', options.editorDefinitions);

  this._globalListeners = [];

  var editors = options.editorDefinitions.map((definition) => {
    var id = definition.id,
        opts = assign({}, options, {
          id: options.id + '#' + id,
          shortId: id,
          label: definition.label
        });

    var EditorComponent = definition.component;

    var editor = new EditorComponent(opts);

    if (definition.isFallback) {
      this.fallbackEditor = editor;
    }

    // handle import errors
    editor.on('shown', (context) => {
      var dialog = this.dialog;

      // don't do anything if the current editor is the fallback editor
      if (editor === this.fallbackEditor) {
        return;
      }

      // context can be undefined here if lastImport is undefined
      var error = context ? context.error : null;

      if (error) {
        this.logger.error('failed to import content for file "%s"', this.file.name);
        this.logger.error('%s', error.message);

        // show import error dialog
        dialog.importError(this.file.name, error.message, (err, answer) => {
          if (err) {
            return;
          }

          debug('reset to fallback editor');

          // switch to fallback editor
          this.setEditor(this.fallbackEditor);
        });
      }
    });

    editor.on('layout:changed', this.events.composeEmitter('layout:update'));

    editor.on('state-updated', (state) => {

      this.dirty = this.isUnsaved() || state.dirty;

      var newState = assign({
        diagramType: this.getDiagramType(),
        save: true,
        closable: true
      }, state, { dirty: this.dirty });

      // propagate state changed
      this.stateChanged(newState);
    });

    editor.on('changed', this.events.composeEmitter('changed'));

    editor.on('log:toggle', this.events.composeEmitter('log:toggle'));

    editor.on('context-menu:open', this.events.composeEmitter('context-menu:open'));

    /**
     * messages = [ [ category, message ]* ]
     */
    editor.on('log', (messages) => {

      messages.forEach((m) => {
        this.logger[m[0]](m[1]);
      });
    });

    this._globalListeners.push({
      eventName: 'window:resized',
      callback: function(evt) {
        editor.emit('window:resized', evt);
      }
    });

    this._globalListeners.push({
      eventName: 'layout:update',
      callback: function(evt) {
        editor.emit('layout:update', evt);
      }
    });

    this._globalListeners.push({
      eventName: 'input:focused',
      callback: function(evt) {
        editor.emit('input:focused', evt);
      }
    });

    return editor;
  });

  this._globalListeners.forEach((gl) => {
    this.events.on(gl.eventName, gl.callback);
  });

  return editors;
};

/**
 * Save the tab, calling back with (err, file).
 *
 * @param {Function} done
 */
MultiEditorTab.prototype.save = function(done) {

  var activeEditor = this.activeEditor;

  if (!activeEditor.saveXML) {
    return done(unsupportedSave());
  }

  activeEditor.saveXML((err, xml) => {

    if (err) {
      return done(err);
    }

    return done(null, assign({}, this.file, { contents: xml }));
  });
};

MultiEditorTab.prototype.setFile = function(file) {
  this.file = file;
  this.label = file.name;
  this.title = file.path;
  this.dirty = isUnsaved(file);

  this.editors.forEach(function(editor) {
    editor.setFile(file);
  });

  this.events.emit('changed');
};

MultiEditorTab.prototype.isUnsaved = function() {
  return isUnsaved(this.file);
};

MultiEditorTab.prototype.getDiagramType = function() {
  return this.file && this.file.fileType;
};

MultiEditorTab.prototype.triggerAction = function(action, options) {
  if (this.activeEditor.triggerAction) {
    this.activeEditor.triggerAction(action, options);
  }
};

MultiEditorTab.prototype.stateChanged = function(newState) {
  this.events.emit('tools:state-changed', this, newState);
};

MultiEditorTab.prototype.render = function() {

  var compose = this.compose;

  return (
    <div className="multi-editor-tab tabbed">
      <div className="content">
        { h(this.activeEditor) }
      </div>

      <div className="tabs">
        {
          this.editors.map((editor) => {
            return (
              <a
                className={ 'tab ' + (this.activeEditor === editor ? 'active' : '') }
                ref={ editor.shortId + '-switch' }
                onClick={ compose('showEditor', editor) }>
                { editor.label }
              </a>
            );
          })
        }
      </div>
    </div>
  );
};


function unsupportedExportAs() {
  return new Error('<exportAs> not supported for the current tab');
}


function unsupportedSave() {
  return new Error('<save> not supported for current tab');
}


/**
 * Returns a copy of the file with the given extension.
 *
 * @param {FileDescriptor} file
 * @param {String} extension
 *
 * @return {FileDescriptor}
 */
function withExtension(file, extension) {
  return {
    name: replaceFileExt(file.name, extension),
    path: !isUnsaved(file.path) ? replaceFileExt(file.path, extension) : file.path,
    fileType: extension
  };
}
