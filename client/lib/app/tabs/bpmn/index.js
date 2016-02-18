'use strict';

var debug = require('debug')('bpmn-support');

var ensureOpts = require('util/ensure-opts');


var initialXML = require('./initial.bpmn');

var BpmnTab = require('./bpmn-tab');

var ids = require('ids')();


/**
 * Add ability to create and open BPMN diagrams.
 *
 * @param {Object} options
 */
function BpmnSupport(options) {

  ensureOpts([ 'app', 'events' ], options);

  // TODO(nikku): remove events and register as diagram
  // provider on app (via API) instead (!!)

  var events = options.events,
      app = options.app;

  var createdTabs = 0;

  events.on('create-diagram', (type) => {

    // increment counter
    createdTabs++;

    if (type === 'bpmn') {
      debug('create BPMN file');

      app.createDiagramTab({
        fileType: type,
        name: 'diagram_' + createdTabs + '.bpmn',
        path: '[unsaved]',
        contents: initialXML
      }, { select: true });
    }
  });

  events.on('create-tab', (file, options) => {

    var tab;

    options = options || {};

    if (file.fileType === 'bpmn') {

      tab = app.createComponent(BpmnTab, {
        file: file,
        closable: true,
        dirty: options.dirty,
        id: ids.next()
      });

      app.addTab(tab, options);
    }
  });

}

module.exports = BpmnSupport;
