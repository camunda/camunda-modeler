'use strict';

var inherits = require('inherits');

var BaseEditor = require('./base');

var assign = require('lodash/object/assign');

var domify = require('domify');

var ensureOpts = require('util/ensure-opts');

var debug = require('debug')('diagram-editor');


/**
 * Base diagram editor.
 *
 * @param {Object} options
 */
function DiagramEditor(options) {

  ensureOpts([
    'logger',
    'events',
    'layout',
    'file'
  ], options);

  BaseEditor.call(this, options);

  // elements to insert modeler and properties panel into
  this.$el = domify('<div class="diagram-parent"></div>'),

  // last successfully imported xml diagram
  this.lastXML = null;

  // last state since save for dirty checking
  this.lastStackIndex = -1;

  // if we are mouted
  this.mounted = false;
}

inherits(DiagramEditor, BaseEditor);

module.exports = DiagramEditor;


DiagramEditor.prototype.triggerImport = function() {

  var file = this.file,
      lastXML = this.lastXML,
      logger = this.logger,
      modeler = this.getModeler();

  // check if import / reimport of diagram is needed
  if (file.contents !== lastXML) {

    if (!lastXML) {
      logger.info('ref:' + this.id, 'diagram <%s> opening', this.id);
    } else {
      logger.info('ref:' + this.id, 'diagram <%s> contents changed, reopening', this.id);
    }

    this.lastXML = file.contents;

    modeler.importXML(file.contents, (err, warnings) => {

      // remember stuff relevant for detecting
      // reimport + dirty state changes
      this.lastStackIndex = this.getStackIndex();

      logger.info('diagram <%s> opened', this.id);

      if (err) {
        logger.info('ERROR: %s', err.message);
      }

      if (warnings.length) {
        logger.info('WARNINGS: \n%s', warnings.join('\n'));
      }
    });

    return true;
  }
};

DiagramEditor.prototype.mountCanvas = function(node) {

  debug('mount canvas');

  // (1) append element
  node.appendChild(this.$el);
  this.mounted = true;

  // (2) check if we need update / reopen
  if (this.triggerImport()) {
    return;
  }

  // (3) update edit state
  this.updateState();
};

DiagramEditor.prototype.unmountCanvas = function(node) {
  debug('unmount canvas');

  node.removeChild(this.$el);
};

DiagramEditor.prototype.setFile = function(newFile) {
  this.file = newFile;

  // update dirty state
  // unless we reimport anyway
  if (this.mounted && this.triggerImport()) {
    return;
  }

  this.lastStackIndex = this.getStackIndex();

  this.updateState();
};

DiagramEditor.prototype.save = function(done) {

  var modeler = this.getModeler();

  modeler.saveXML({ format: true }, (err, xml) => {
    if (err) {
      return done(err);
    }

    this.lastXML = xml;

    var newFile = assign({}, this.file, { contents: xml });

    done(null, newFile);
  });
};
