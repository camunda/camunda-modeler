'use strict';

var inherits = require('inherits');

var assign = require('lodash/object/assign');

var BaseComponent = require('base/component');

var domify = require('domify');

var ensureOpts = require('util/ensure-opts');

var debug = require('debug')('diagram-editor');


/**
 * Base diagram editor.
 *
 * @param {Object} options
 */
function DiagramEditor(options) {

  BaseComponent.call(this, options);

  ensureOpts([ 'layout' ], options);


  // elements to insert modeler and properties panel into
  this.$el = domify('<div class="diagram-parent"></div>');

  // diagram contents
  this.newXML = null;

  // last well imported xml diagram
  this.lastXML = null;

  // are we mounted
  this.mounted = false;

  // the editors initial state
  this.initialState = {
    dirty: false
  };
}

inherits(DiagramEditor, BaseComponent);

module.exports = DiagramEditor;


/**
 * Update the editor contents because they changed
 * or we re-mounted.
 */
DiagramEditor.prototype.update = function() {

  // only do actual work if mounted
  if (!this.mounted) {
    debug('[#update] skipping (not mounted)');

    return;
  }

  var modeler = this.getModeler(),
      lastXML = this.lastXML,
      newXML = this.newXML;

  // reimport in XML change
  if (!newXML || lastXML === newXML) {
    debug('[#update] skipping (no change)');

    this.emit('updated', this.lastImport);

    return;
  }

  debug('[#update] import');

  this.emit('import', newXML);

  this.lastXML = newXML;

  modeler.importXML(newXML, (err, warnings) => {

    var importContext = this.lastImport = {
      error: err,
      warnings: warnings,
      xml: newXML
    };

    debug('[#update] imported', importContext);

    this.emit('imported', importContext);

    this.emit('updated', importContext);
  });
};

DiagramEditor.prototype.mountEditor = function(node) {

  debug('mount');

  this.emit('mount');

  // (1) append element
  node.appendChild(this.$el);
  this.mounted = true;

  this.emit('mounted');

  // (2) attempt import
  this.update();
};

DiagramEditor.prototype.unmountEditor = function(node) {
  this.emit('unmount');

  debug('unmount');

  this.mounted = false;
  node.removeChild(this.$el);

  this.emit('unmounted');
};

DiagramEditor.prototype.saveXML = function(done) {

  var modeler = this.getModeler();

  debug('[#saveXML] save');

  this.emit('save');

  modeler.saveXML({ format: true }, (err, xml) => {

    var saveContext = { error: err, xml: xml };

    debug('[#saveXML] saved', saveContext);

    this.emit('saved', saveContext);

    if (err) {
      return done(err);
    }

    this.lastXML = this.newXML = xml;

    done(null, xml);
  });
};

/**
 * Set XML on the editor, passing the initial (dirty)
 * state with it.
 *
 * @param {String} xml
 * @param {Object} initialState
 */
DiagramEditor.prototype.setXML = function(xml, initialState) {

  if (initialState) {
    this.initialState = assign({ xml: xml }, initialState);
  }

  // (1) mark new xml
  this.newXML = xml;

  // (2) attempt import
  this.update();
};