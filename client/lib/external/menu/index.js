'use strict';

const ipcRenderer = require('electron').ipcRenderer;
var debug = require('debug')('Menu');
var Triggers = require('./menu-triggers');

module.exports = function Menu(clientApi) {
  new Triggers(clientApi);

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

  clientApi.on('tools:state-changed', function (tab, state) {
    debug('---> tools:state-changed: ', tab, state);

    clientState.diagramType = tab.file.fileType;
    clientState.undo = state.undo;
    clientState.redo = state.redo;
    clientState.dirty = state.dirty;
    clientState.tabs = clientApi.tabs.length;

    ipcRenderer.send('menu:update', clientState);
  });

  clientApi.on('tab:closed', function (tab) {
    debug('---> tab:closed: ', tab);

    clientState.tabs = clientApi.tabs.length;

    ipcRenderer.send('menu:update', clientState);
  });


};