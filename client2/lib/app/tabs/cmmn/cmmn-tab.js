'use strict';

var inherits = require('inherits');

import {
  assign
} from 'min-dash';

var CmmnEditor = require('../../editor/cmmn-editor'),
    XMLEditor = require('../../editor/xml-editor'),
    MultiEditorTab = require('../multi-editor-tab');


/**
 * A tab displaying a CMMN diagram.
 *
 * @param {Object} options
 */
function CmmnTab(options) {

  if (!(this instanceof CmmnTab)) {
    return new CmmnTab(options);
  }

  options = assign({
    editorDefinitions: [
      { id: 'diagram', label: 'Diagram', component: CmmnEditor },
      { id: 'xml', label: 'XML', isFallback: true, component: XMLEditor }
    ]
  }, options);

  MultiEditorTab.call(this, options);
}

inherits(CmmnTab, MultiEditorTab);

module.exports = CmmnTab;
