'use strict';

var inherits = require('inherits');

var assign = require('lodash/object/assign');

var DmnEditor = require('../../editor/dmn-editor'),
    XMLEditor = require('../../editor/xml-editor'),
    MultiEditorTab = require('../multi-editor-tab');


/**
 * A DMN specific multi editor tab that updates
 * the tab label depending on whether diagram (DRD)
 * or tables are currently being edited.
 *
 * @param {Object} options
 */
function DmnTab(options) {
  var label = 'Table';

  if (!(this instanceof DmnTab)) {
    return new DmnTab(options);
  }

  if (options.file) {
    label = options.file.loadDiagram ? 'Diagram' : 'Table';
  }

  options = assign({
    editorDefinitions: [
      { id: 'dmn-editor', label: label, component: DmnEditor },
      { id: 'xml', label: 'XML', isFallback: true, component: XMLEditor }
    ]
  }, options);

  MultiEditorTab.call(this, options);
}

inherits(DmnTab, MultiEditorTab);

module.exports = DmnTab;


// DMN SPECIFIC: We need to update the DMN tabs label
// based on whether it displays table or drd diagram.
DmnTab.prototype.stateChanged = function(newState) {

  var isDMN = newState.dmn,
      editor, activeEditorName, label;

  if (isDMN) {
    editor = this.getEditor('dmn-editor');

    activeEditorName = editor.getActiveEditorName();

    switch (activeEditorName) {
    case 'table':
      label = 'Table';
      break;
    case 'diagram':
      label = 'Diagram';
      break;
    default:
      label = 'Literal Expression';
    }

    editor.name = editor.label = label;
  }

  MultiEditorTab.prototype.stateChanged.call(this, newState);
};
