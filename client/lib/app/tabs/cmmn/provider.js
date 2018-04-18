'use strict';

var debug = require('debug')('cmmn-provider');

var ensureOpts = require('util/ensure-opts');

var initialXML = require('./initial.cmmn');

var CmmnTab = require('./cmmn-tab');

var ids = require('ids')([ 32, 36, 1 ]);


/**
 * Add ability to create and open CMMN diagrams.
 *
 * @param {Object} options
 */
function CmmnProvider(options) {

  ensureOpts([ 'app' ], options);

  var app = options.app;

  var createdFiles = 0;

  this.createNewFile = function(attrs) {
    attrs = attrs || {};

    debug('create CMMN file');

    // make ID ROBUST
    var xml = initialXML.replace('{{ ID }}', ids.next());

    return {
      fileType: 'cmmn',
      name: attrs.name || 'diagram_' + (++createdFiles) + '.cmmn',
      path: attrs.path || '',
      contents: xml,
      isUnsaved: true
    };
  };

  this.canCreate = function(fileType) {
    return fileType === 'cmmn';
  };

  this.createTab = function(file) {
    return app.createComponent(CmmnTab, {
      file: file,
      closable: true,
      id: ids.next(),
      metaData: app.metaData
    });
  };

}

module.exports = CmmnProvider;
