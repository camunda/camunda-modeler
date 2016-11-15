'use strict';

var describeEditor = require('./commons').describeEditor;

var DmnEditor = require('app/editor/dmn-editor');

var initialXML = require('app/tabs/dmn/table.dmn'),
    otherXML = require('./other.dmn');


function createEditor() {
  return new DmnEditor({
    layout: {
      propertiesPanel: {}
    }
  });
}

describeEditor('DmnEditor', {
  createEditor: createEditor,
  initialXML: initialXML,
  otherXML: otherXML,
  isDiagramEditor: true
});


describe('DmnEditor', function() { });
