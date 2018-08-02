'use strict';

var debug = require('debug')('bpmn-provider');

var ensureOpts = require('util/ensure-opts');

var initialXML = require('./initial.bpmn');

var BpmnTab = require('./bpmn-tab');

var ids = require('ids')([ 32, 36, 1 ]);


/**
 * Add ability to create and open BPMN diagrams.
 *
 * @param {Object} options
 */
function BpmnProvider(options) {

  ensureOpts([ 'app', 'plugins' ], options);

  var app = options.app;

  var createdFiles = 0;

  this.createNewFile = function(attrs) {
    attrs = attrs || {};

    debug('create BPMN file');

    // make ID ROBUST
    var xml = initialXML.replace('{{ ID }}', ids.next());

    return {
      fileType: 'bpmn',
      name: attrs.name || 'diagram_' + (++createdFiles) + '.bpmn',
      path: attrs.path || '',
      contents: xml,
      isInitial: true,
      isUnsaved: true
    };
  };

  this.canCreate = function(fileType) {
    return fileType === 'bpmn';
  };

  this.createTab = function(file) {
    return app.createComponent(BpmnTab, {
      file: file,
      closable: true,
      id: ids.next(),
      metaData: app.metaData,
      plugins: options.plugins
    });
  };

}

module.exports = BpmnProvider;
