'use strict';

var inherits = require('inherits'),
    domify = require('domify');

var BaseEditor = require('./base-editor');

var debug = require('debug')('xml-editor');

var CodeMirror = require('codemirror');

// xml syntax highlighting
require('codemirror/mode/xml/xml');

// auto close tags
require('codemirror/addon/fold/xml-fold');
require('codemirror/addon/edit/closetag');

// search addons
require('codemirror/addon/search/search');
require('codemirror/addon/search/searchcursor');
require('codemirror/addon/dialog/dialog');

/**
 * A xml editor
 *
 * @param {Object} options
 */
function XMLEditor(options) {

  BaseEditor.call(this, options);

  // update edit state with every shown
  this.on('updated', (ctx) => {
    this.updateState();

    this.emit('shown', ctx);
  });

  this.on('shown', () => {

    // let code mirror update its look and feel
    this.getCodeMirror().refresh();
  });
}

inherits(XMLEditor, BaseEditor);

module.exports = XMLEditor;


XMLEditor.prototype.render = function() {

  return (
    <div className="xml-editor" key={ this.id + '#xml' }>
      <div
        className="editor-container"
        tabIndex="0"
        onAppend={ this.compose('mountEditor') }
        onRemove={ this.compose('unmountEditor') }>
      </div>
    </div>
  );
};

XMLEditor.prototype.updateState = function() {

  var codemirror = this.getCodeMirror(),
      history = codemirror.doc.historySize();

  var initialState = this.initialState || { xml: this.lastXML };

  var xml = codemirror.getValue();

  var stateContext = {
    undo: !!history.undo,
    redo: !!history.redo,
    dirty: (
      initialState.dirty ||
      initialState.xml !== xml
    ),
    exportAs: false,
    editable: true,
    searchable: true
  };

  this.emit('state-updated', stateContext);
};


XMLEditor.prototype.update = function() {

  // only do actual work if mounted
  if (!this.mounted) {
    debug('[#update] skipping (not mounted)');

    return;
  }

  var codemirror = this.getCodeMirror(),
      lastXML = this.lastXML,
      currentXML = codemirror.getValue(),
      newXML = this.newXML;

  // reimport in XML change
  if (!newXML || lastXML === newXML || newXML === currentXML) {
    debug('[#update] skipping (no change)');

    this.emit('updated', {});

    return;
  }

  codemirror.setValue(newXML);

  this.emit('imported', newXML);

  this.lastXML = newXML;

  this.emit('updated', {});
};


/**
 * Get or create an instance of the underlying
 * CodeMirror text editor.
 *
 * @return {CodeMirror}
 */
XMLEditor.prototype.getCodeMirror = function() {
  var $el = this.$el,
      textarea;

  if (this.codemirror) {
    return this.codemirror;
  }

  textarea = domify('<textarea></textarea>');

  $el.appendChild(textarea);

  var codemirror = this.codemirror = CodeMirror.fromTextArea(textarea, {
    lineNumbers: true,
    mode: {
      name: 'application/xml',
      htmlMode: false
    },
    tabSize: 2,
    lineWrapping: true,
    autoCloseTags: true
  });

  codemirror.on('changes', (cm) => {

    // on initial import, reset history to prevent
    // undo by the user
    if (!this.lastXML) {
      cm.doc.clearHistory();
    }

    this.updateState();
  });

  return codemirror;
};

XMLEditor.prototype.triggerAction = function(action, options) {
  var codemirror = this.getCodeMirror();

  if (action === 'undo') {
    codemirror.doc.undo();
  }

  if (action === 'redo') {
    codemirror.doc.redo();
  }

  if (action === 'find') {
    codemirror.execCommand('findPersistent');
  }

  if (action === 'findNext') {
    codemirror.execCommand('findNext');
  }

  if (action === 'findPrev') {
    codemirror.execCommand('findPrev');
  }

  if (action === 'replace') {
    codemirror.execCommand('replace');
  }

};


XMLEditor.prototype.saveXML = function(done) {
  var codemirror = this.getCodeMirror(),
      xml;

  debug('#saveXML - save');

  this.emit('save');

  this.lastXML = this.newXML = xml = codemirror.getValue();

  var saveContext = { error: null, xml: xml };

  debug('#saveXML - saved', saveContext);

  this.emit('saved', saveContext);

  done(null, xml);
};


XMLEditor.prototype.destroy = function() {
  if (this.codemirror) {
    this.codemirror.toTextArea();
  }
};
