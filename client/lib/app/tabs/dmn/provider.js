'use strict';

var debug = require('debug')('dmn-provider');

var ensureOpts = require('util/ensure-opts');

var isUnsaved = require('util/file/is-unsaved');

var tableXML = require('./table.dmn'),
    diagramXML = require('./diagram.dmn');

var DmnTab = require('./dmn-tab');

var ids = require('ids')([ 32, 36, 1 ]);

// TODO(vlad): add shared super type for DMN/BPMN providers
/**
 * Add ability to create and open DMN tables.
 *
 * @param {Object} options
 */
function DmnProvider(options) {

  ensureOpts([ 'app' ], options);

  var app = options.app;

  var createdFiles = 0;

  this.createNewFile = function(attrs) {
    var xml;

    attrs = attrs || {};

    // increment counter
    createdFiles++;

    debug('create DMN file');

    xml = attrs.isTable ? tableXML : diagramXML;

    // make ID ROBUST
    xml = xml.replace('id="definitions"', 'id="definitions_' + ids.next() + '"');

    return {
      fileType: 'dmn',
      name: 'diagram_' + createdFiles + '.dmn',
      path: isUnsaved.PATH,
      contents: xml,
      loadDiagram: !attrs.isTable
    };
  };

  this.canCreate = function(fileType) {
    return fileType === 'dmn';
  };

  this.createTab = function(file) {

    // TODO(vlad): get rid of app all together for tab provider
    return app.createComponent(DmnTab, {
      file: file,
      closable: true,
      id: ids.next()
    });
  };
}

module.exports = DmnProvider;
