'use strict';

var inherits = require('inherits');

var assign = require('lodash/object/assign');

var DmnEditor = require('../../editor/dmn-editor'),
    XMLEditor = require('../../editor/xml-editor'),
    MultiEditorTab = require('../multi-editor-tab');


/**
 * A tab displaying a DMN diagram.
 *
 * @param {Object} options
 */
function DmnTab(options) {

  if (!(this instanceof DmnTab)) {
    return new DmnTab(options);
  }

  options = assign({
    editorDefinitions: [
      { id: 'table', label: 'Table', component: DmnEditor },
      { id: 'xml', label: 'XML', isFallback: true, component: XMLEditor }
    ]
  }, options);

  MultiEditorTab.call(this, options);
}

inherits(DmnTab, MultiEditorTab);

module.exports = DmnTab;
