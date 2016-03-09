'use strict';

var debug = require('debug')('dmn-provider');

var ensureOpts = require('util/ensure-opts');


var initialXML = require('./initial.dmn');

var DmnTab = require('./dmn-tab');

var ids = require('ids')();

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

  this.createNewFile = function() {
    // increment counter
    createdFiles++;

    debug('create DMN file');

    return {
      fileType: 'dmn',
      name: 'diagram_' + createdFiles + '.dmn',
      path: '[unsaved]',
      contents: initialXML
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
