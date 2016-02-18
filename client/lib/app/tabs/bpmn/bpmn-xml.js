'use strict';

var ensureOpts = require('util/ensure-opts');

var inherits = require('inherits');

var XmlEditor = require('../../editor/xml-editor');


function BpmnXmlEditor(options) {

  ensureOpts([ 'file' ], options);

  XmlEditor.call(this, options);

  this.events.on('xml-editor:mounted', () => {
    var xml = this.file.contents,
        codemirror = this.codemirror;

    codemirror.setValue(xml);
  });
}

inherits(BpmnXmlEditor, XmlEditor);

module.exports = BpmnXmlEditor;
