'use strict';

var debug = require('debug')('multi-editor-tab');

var inherits = require('inherits');

var h = require('vdom/h');

var isUnsaved = require('util/file/is-unsaved'),
    ensureOpts = require('util/ensure-opts');

var Tab = require('base/components/tab');

var assign = require('lodash/object/assign'),
    find = require('lodash/collection/find');


/**
 * A tab holding a number of editors for a given file.
 *
 * @param {Object} options
 */
function MultiEditorTab(options) {

  ensureOpts([
    'events',
    'file',
    'dialog'
  ], options);

  Tab.call(this, options);

  this.editors = this.createEditors(options);

  this.activeEditor = this.editors[0];

  // initialize with passed file, if any
  if (options.file) {
    this.setFile(options.file);
  }
}

inherits(MultiEditorTab, Tab);

module.exports = MultiEditorTab;


MultiEditorTab.prototype.showEditor = function(id) {

  var newEditor = this.getEditor(id),
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

      this.dialog.exportError(err, () => {});

      return;
    }

    newEditor.once('shown', (results) => {

      var error = results && results.error;

      if (error) {
        debug('[#showEditor] editor shown with error', err);

        // show error dialog
        this.dialog.importError(results.error, () => {
          debug('[#showEditor] reset to old editor');

          // set the old editor
          this.setEditor(oldEditor);
        });
      } else {
        debug('[#showEditor] editor shown');
      }
    });

    // set new editor
    this.setEditor(newEditor);

    // sync XML contents
    newEditor.setXML(xml);
  });

};

MultiEditorTab.prototype.getEditor = function(id) {
  var editor;

  if (typeof id === 'string') {
    editor = find(this.editors, { id: this.id + '#' + id });
  } else {
    editor = id;
  }

  if (!editor) {
    throw new Error('no editor ' + id);
  }

  return editor;
};

MultiEditorTab.prototype.setEditor = function(editor) {
  this.activeEditor = editor;
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

  return options.editorDefinitions.map(definition => {
    var id = definition.id,
        opts = assign({}, options, {
          id: options.id + '#' + id,
          shortId: id,
          label: definition.label
        });

    var EditorComponent = definition.component;

    var component = new EditorComponent(opts);

    component.on('layout:changed', this.events.composeEmitter('layout:update'));

    component.on('state-updated', this.events.composeEmitter('tools:state-changed', this));

    component.on('changed', this.events.composeEmitter('changed'));

    /**
     * messages = [ [ category, message ]* ]
     */
    component.on('log', (messages) => {

      messages.forEach((m) => {
        this.logger[m[0]](m[1]);
      });

      this.events.emit('log:toggle', { open: true });
    });

    return component;
  });
};

/**
 * Save the tab, calling back with (err, file).
 *
 * @param {Function} done
 */
MultiEditorTab.prototype.save = function(done) {
  if (this.activeEditor.saveXML) {

    this.activeEditor.saveXML((err, xml) => {

      if (err) {
        return done(err);
      }

      return done(null, assign(this.file, { contents: xml }));
    });
  }

  // TODO(nikku): handle missing activeEditor.saveXML (?)
};

MultiEditorTab.prototype.setFile = function(file) {
  this.file = file;
  this.label = file.name,
  this.title = file.path,

  this.editors.forEach(function(editor) {
    editor.setXML(file.contents, { dirty: isUnsaved(file) });
  });

  this.events.emit('changed');
};

MultiEditorTab.prototype.isUnsaved = function() {
  return isUnsaved(this.file);
};

MultiEditorTab.prototype.triggerAction = function(action, options) {
  if (this.activeEditor.triggerAction) {
    this.activeEditor.triggerAction(action, options);
  }
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
          this.editors.map(editor => {
            return (
              <div className={ 'tab ' + (this.activeEditor === editor ? 'active' : '') }
                   tabIndex="0"
                   ref={ editor.shortId + '-switch' }
                   onClick={ compose('showEditor', editor) }>
                { editor.label }
              </div>
            );
          })
        }
      </div>
    </div>
  );
};