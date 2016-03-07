'use strict';

var debug = require('debug')('dmn-support');

var ensureOpts = require('util/ensure-opts');


var initialXML = require('./initial.dmn');

var DmnTab = require('./dmn-tab');

var ids = require('ids')();


/**
 * Add ability to create and open DMN tables.
 *
 * @param {Object} options
 */
function DmnSupport(options) {

  ensureOpts([ 'app', 'events' ], options);

  // TODO(nikku): remove events and register as diagram
  // provider on app (via API) instead (!!)

  var events = options.events,
      app = options.app;

  var createdTabs = 0;

  events.on('create-diagram', type => {

    // increment counter
    createdTabs++;

    if (type === 'dmn') {
      debug('create DMN file');

      app.createTab({
        fileType: type,
        name: 'diagram_' + createdTabs + '.dmn',
        path: '[unsaved]',
        contents: initialXML
      });
    }
  });

  events.on('create-tab', (file, options) => {

    var tab;

    options = options || {};

    if (file.fileType === 'dmn') {

      tab = app.createComponent(DmnTab, {
        file: file,
        closable: true,
        dirty: options.dirty,
        id: ids.next()
      });

      app.addTab(tab, options);
      app.selectTab(tab);
    }
  });

}

module.exports = DmnSupport;
