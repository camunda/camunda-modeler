'use strict';

var inherits = require('inherits'),
    domify = require('domify');

var assign = require('lodash/object/assign');

var BaseComponent = require('base/component');

var debug = require('debug')('xml-editor');

var CodeMirror = require('codemirror');

// xml syntax highlighting
require('codemirror/mode/xml/xml');

// auto close tags
require('codemirror/addon/fold/xml-fold');
require('codemirror/addon/edit/closetag');

/**
 * A xml editor
 *
 * @param {Object} options
 */
function XMLEditor(options) {

  BaseComponent.call(this, options);

  // container for codemirror
  this.$el = domify('<div class="xml-container"></div>');

  // diagram contents
  this.newXML = null;

  // last well imported xml diagram
  this.lastXML = null;

  // if we are mounted
  this.mounted = false;

  // the editors initial state
  this.initialState = {
    dirty: false
  };

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

inherits(XMLEditor, BaseComponent);

module.exports = XMLEditor;

XMLEditor.prototype.render = function() {

  return (
    <div className="xml-editor" key={ this.id + '#xml' }
         onAppend={ this.compose('mountEditor') }
         onRemove={ this.compose('unmountEditor') }>
    </div>
  );
};

XMLEditor.prototype.updateState = function() {

  var codemirror = this.getCodeMirror(),
      history = codemirror.doc.historySize();

  var initialState = this.initialState || { xml: this.lastXML };

  var stateContext = {};

  // TODO(nikku): complete / more updates?
  stateContext = {
    undo: !!history.undo,
    redo: !!history.redo,
    dirty: (
      initialState.dirty ||
      initialState.xml !== codemirror.getValue()
    )
  };

  this.emit('state-updated', stateContext);
};

XMLEditor.prototype.mountEditor = function(node) {

  debug('mount');

  this.emit('mount');

  // (1) append element
  node.appendChild(this.$el);
  this.mounted = true;

  this.emit('mounted');

  // (2) attempt import
  this.update();
};

XMLEditor.prototype.unmountEditor = function (node) {
  this.emit('unmount');

  debug('unmount');

  this.mounted = false;
  node.removeChild(this.$el);

  this.emit('unmounted');
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

/**
 * Set XML on the editor, passing the initial (dirty)
 * state with it.
 *
 * @param {String} xml
 * @param {Object} initialState
 */
XMLEditor.prototype.setXML = function(xml, initialState) {

  if (initialState) {
    this.initialState = assign({ xml: xml }, initialState);
  }

  // (1) mark new xml
  this.newXML = xml;

  // (2) attempt import
  this.update();
};