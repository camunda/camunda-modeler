'use strict';

var browser = require('util/browser');

var debug = require('debug')('Menu');

var Triggers = require('./menu-triggers');


function Menu(app) {
  new Triggers(app);

  var clientState = {
    diagramType : 'bpmn',
    undo : false,
    redo : false,
    cut : false,
    copy : false,
    paste : false,
    selectAll : false,
    save : false,
    saveAs : false,
    closeTab : false,
    handTool : false,
    lassoTool : false,
    spaceTool : false,
    directEdit : false,
    moveCanvas : false,
    removeSelected : false,
    zoomIn : false,
    zoomOut : false,
    zoomDefault : false,
    dirty : false,
    tabs : 1
  };

  app.on('tools:state-changed', function (tab, state) {
    debug('---> tools:state-changed: ', tab, state);

    clientState.diagramType = tab.file.fileType;
    clientState.undo = state.undo;
    clientState.redo = state.redo;
    clientState.dirty = state.dirty;
    clientState.tabs = app.tabs.length;

    browser.send('menu:update', clientState);
  });

  app.on('tab:closed', function (tab) {
    debug('---> tab:closed: ', tab);

    clientState.tabs = app.tabs.length;

    browser.send('menu:update', clientState);
  });
}

module.exports = Menu;
