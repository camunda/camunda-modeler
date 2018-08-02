'use strict';

var inherits = require('inherits');

import {
  assign
} from 'min-dash';

var BaseComponent = require('base/component');

var domify = require('domify');

var debug = require('debug')('base-editor');

var needsOverride = require('util/needs-override');


/**
 * Base editor.
 *
 * @param {Object} options
 */
function BaseEditor(options) {

  BaseComponent.call(this, options);

  // elements to insert modeler and properties panel into
  this.$el = domify('<div class="editor-parent"></div>');

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

inherits(BaseEditor, BaseComponent);

module.exports = BaseEditor;


/**
 * Plug that into the virtual dom life-cycle to mount
 * the editor on dom append.
 *
 * @param {DOMElement} node
 */
BaseEditor.prototype.mountEditor = function(node) {

  debug('mount');

  this.emit('mount');

  // (1) append element
  node.appendChild(this.$el);
  this.mounted = true;

  this.emit('mounted');

  // (2) attempt import
  this.update();
};


/**
 * Plug that into the virtual dom life-cycle to unmount
 * the editor on dom remove.
 *
 * @param {DOMElement} node
 */
BaseEditor.prototype.unmountEditor = function(node) {
  this.emit('unmount');

  debug('unmount');

  this.mounted = false;
  node.removeChild(this.$el);

  this.emit('unmounted');
};


/**
 * Update the editor contents because they changed
 * or we re-mounted.
 */
BaseEditor.prototype.update = function() {
  throw needsOverride();
};


/**
 * Save the editor contents as XML and pass the results
 * to the given callback.
 *
 * @param {Function} done
 */
BaseEditor.prototype.saveXML = function(done) {
  throw needsOverride();
};


/**
 * Will the editor lose it's history while importing new xml
 *
 * @param {String} xml
 */
BaseEditor.prototype.isHistoryLost = function(xml) {
  return false;
};


/**
 * Set XML on the editor, passing the initial (dirty)
 * state with it.
 *
 * @param {String} xml
 * @param {Object} initialState
 */
BaseEditor.prototype.setXML = function(xml, initialState) {

  if (initialState) {
    this.initialState = assign({}, initialState, { xml: xml });
  }

  // (1) mark new xml
  this.newXML = xml;

  // (2) attempt import
  this.update();
};

/**
 * Sets the file that this editor displays.
 *
 * @param {FileDescriptor} file
 */
BaseEditor.prototype.setFile = function(file) {
  this.file = file;
  this.setXML(file.contents, {});
};

/**
 * Clean up resources and any bindings.
 */
BaseEditor.prototype.destroy = function() {
  throw needsOverride();
};
