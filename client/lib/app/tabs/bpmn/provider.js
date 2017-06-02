'use strict';

var debug = require('debug')('bpmn-provider');

var ensureOpts = require('util/ensure-opts');

var isUnsaved = require('util/file/is-unsaved');

var initialXML = require('./initial.bpmn');

var BpmnTab = require('./bpmn-tab');

var ids = require('ids')();


/**
 * Add ability to create and open BPMN diagrams.
 *
 * @param {Object} options
 */
function BpmnProvider(options) {

  ensureOpts([ 'app', 'plugins' ], options);

  var app = options.app;

  var createdFiles = 0;

  this.createNewFile = function() {
    // increment counter
    createdFiles++;

    debug('create BPMN file');

    return {
      fileType: 'bpmn',
      name: 'diagram_' + createdFiles + '.bpmn',
      path: isUnsaved.PATH,
      contents: initialXML
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
