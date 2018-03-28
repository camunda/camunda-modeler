'use strict';

var inherits = require('inherits');

import {
  assign
} from 'min-dash';

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
  if (!(this instanceof DmnTab)) {
    return new DmnTab(options);
  }

  options = assign({
    editorDefinitions: [
      { id: 'dmn-editor', label: 'Diagram', component: DmnEditor },
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
    case 'decisionTable':
      label = 'Decision Table';
      break;
    case 'drd':
      label = 'DRD';
      break;
    case 'literalExpression':
      label = 'Literal Expression';
      break;
    default:
      label = 'Unknown';
    }

    editor.name = editor.label = label;
  }

  MultiEditorTab.prototype.stateChanged.call(this, newState);
};
