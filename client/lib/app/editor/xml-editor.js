'use strict';

var ensureOpts = require('util/ensure-opts');

var inherits = require('inherits');

var BaseEditor = require('./base');


function XMLEditor(options) {

  ensureOpts([ 'file' ], options);

  BaseEditor.call(this, options);

  this.setFile = function(newFile) {
    this.file = newFile;
  };

  this.render = function() {
    return <div className="editor">{ this.file.name }</div>;
  };
}

inherits(XMLEditor, BaseEditor);

module.exports = XMLEditor;