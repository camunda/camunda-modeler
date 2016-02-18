'use strict';

var inherits = require('inherits');

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

  // if we are mounted
  this.mounted = false;

  // last state since save for dirty checking
  this.lastStackIndex = -1;

  // update edit state with every shown
  this.on('updated', (ctx) => {
    this.updateState();

    this.emit('shown', ctx);
  });
}

inherits(DiagramEditor, BaseComponent);

module.exports = DiagramEditor;


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

    this.emit('updated', {});

    return;
  }

  debug('[#update] import');

  this.emit('import', newXML);

  modeler.importXML(newXML, (err, warnings) => {

    // remember stuff relevant for detecting
    // reimport + dirty state changes
    this.lastStackIndex = this.getStackIndex();

    this.lastXML = newXML;

    var importContext = {
      err: err,
      warnings: warnings
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

  if (this.warnings) {
    return done(null, this.lastXML);
  }

  debug('#saveXML - save');

  this.emit('save');

  modeler.saveXML({ format: true }, (err, xml) => {

    var saveContext = { error: err, xml: xml };

    debug('#saveXML - saved', saveContext);

    this.emit('saved', saveContext);

    if (err) {
      return done(err);
    }

    this.lastXML = this.newXML = xml;

    done(null, xml);
  });
};

DiagramEditor.prototype.setXML = function(xml) {

  // (1) mark new xml
  this.newXML = xml;

  // (2) attempt import
  this.update();
};

// TODO(nikku): finish or remove

DiagramEditor.prototype.showWarnings = function() {
  // todo later
};

DiagramEditor.prototype.closeWarningsOverlay = function() {
  delete this.warnings;

  // this.events.emit('changed');
};