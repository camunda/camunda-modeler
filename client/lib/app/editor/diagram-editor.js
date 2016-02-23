'use strict';

var inherits = require('inherits');

var BaseEditor = require('./base-editor');

var debug = require('debug')('diagram-editor');


/**
 * Base diagram editor.
 *
 * @param {Object} options
 */
function DiagramEditor(options) {

  BaseEditor.call(this, options);

  this.on('imported', (context) => {
    var xml = context.xml;

    var initialState = this.initialState;

    // we are back at start, unset reimport flag
    if (xml === initialState.xml) {
      initialState.reimported = false;
    } else

    // reimport, we are going to be dirty always
    if ('stackIndex' in initialState) {
      initialState.reimported = true;
    }

    initialState.stackIndex = -1;
  });

  this.on('updated', (context) => {
    var modeler = this.modeler,
        initialState = this.initialState;

    // log stack index on first imported
    // update after loading
    if (isImported(modeler) && !('stackIndex' in initialState)) {
      initialState.stackIndex = this.getStackIndex();
    }

    // on updated, update state and emit <shown> event
    this.updateState();

    this.emit('shown', context);
  });
}

inherits(DiagramEditor, BaseEditor);

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

function isImported(modeler) {
  return !!modeler.definitions;
}
