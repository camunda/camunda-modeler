'use strict';

var inherits = require('inherits');

var assign = require('lodash/object/assign');

var DmnEditor = require('../../editor/dmn-editor'),
    XMLEditor = require('../../editor/xml-editor'),
    DiagramTab = require('../diagram-tab');


/**
 * A tab displaying a BPMN diagram.
 *
 * @param {Object} options
 */
function DmnTab(options) {

  if (!(this instanceof DmnTab)) {
    return new DmnTab(options);
  }

  options = assign({
    viewDefinitions: [
      { id: 'table', label: 'Table', component: DmnEditor },
      { id: 'xml', label: 'XML', component: XMLEditor }
    ]
  }, options);

  DiagramTab.call(this, options);
}

inherits(DmnTab, DiagramTab);

module.exports = DmnTab;