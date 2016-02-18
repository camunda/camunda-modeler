'use strict';

var inherits = require('inherits'),
    domify = require('domify'),
    debounce = require('lodash/function/debounce');

var BaseComponent = require('base/component');

var debug = require('debug')('xml-editor');

var CodeMirror = require('codemirror');

// xml syntax highlighting
require('codemirror/mode/xml/xml');

// auto close tags
require('codemirror/addon/fold/xml-fold');
require('codemirror/addon/edit/closetag');

var DEBOUNCE_DELAY = 250;


/*
  Todo:
  - fix editor height (css)
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
         onAppend={this.compose('mountEditor')}
         onRemove={this.compose('unmountEditor')}>
    </div>
  );
};

XMLEditor.prototype.updateState = function() {

  var codemirror = this.getCodeMirror(),
      history = codemirror.doc.historySize();

  var stateContext = {};

  // TODO(nikku): complete / more updates?
  stateContext = {
    undo: !!history.undo,
    redo: !!history.redo,
    dirty: this.lastXML !== codemirror.getValue()
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
      newXML = this.newXML;

  // reimport in XML change
  if (!newXML || lastXML === newXML) {
    debug('[#update] skipping (no change)');

    this.emit('updated', {});

    return;
  }

  codemirror.setValue(newXML);

  this.emit('imported', newXML);

  // on initial import, reset history to prevent
  // undo by the user
  if (!lastXML) {
    codemirror.doc.clearHistory();
  }

  this.lastXML = newXML;

  this.emit('updated', {});
};


XMLEditor.prototype.getCodeMirror = function () {
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

  codemirror.on('changes', debounce(() => {
    this.updateState();
  }, DEBOUNCE_DELAY));

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

  this.newXML = codemirror.getValue();

  this.updateState();
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

XMLEditor.prototype.setXML = function(xml) {

  // (1) mark new xml
  this.newXML = xml;

  // (2) attempt import
  this.update();
};

XMLEditor.prototype.loadXML = function(xml, opts, done) {
  var newXML = xml;

  if (typeof opts === 'function') {
    done = opts;
    opts = {};
  }

  if (opts.xml) {
    newXML = opts.xml;
  }

  this.setXML(newXML);

  if (opts.warnings) {
    this.showWarnings(opts.warnings);
  }

  this.emit('view:shown');
};

XMLEditor.prototype.showWarnings = function(warnings) {

};
