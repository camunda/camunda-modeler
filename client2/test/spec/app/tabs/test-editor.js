'use strict';

var inherits = require('inherits');

var BaseEditor = require('app/editor/base-editor');

function TestEditor(options) {
  BaseEditor.call(options);


  this.update = function() {};
}

inherits(TestEditor, BaseEditor);

module.exports = TestEditor;