'use strict';

var inherits = require('inherits');

var ensureOpts = require('util/ensure-opts');

var BaseComponent = require('base/component');


function Editor(options) {

  ensureOpts([ 'events' ], options);

  BaseComponent.call(this, options);


  this.updateEditorActions = function(state) {
    this.events.emit('tools:update-edit-state', this, state);
  };
}

inherits(Editor, BaseComponent);

module.exports = Editor;