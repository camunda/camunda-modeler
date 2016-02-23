'use strict';

const ipcRenderer = require('electron').ipcRenderer;
var debug = require('debug')('Menu');
var Triggers = require('./menu-triggers');

module.exports = function Menu(clientApi) {
  new Triggers(clientApi);

  var menuState = {
    diagramType : 'bpmn',
    undo : true,
    redo : true,
    cut : true,
    copy : true,
    paste : true,
    selectAll : true,
    save : true,
    saveAs : true,
    closeTab : true,
    handTool : true,
    lassoTool : true,
    spaceTool : true,
    directEdit : true,
    moveCanvas : true,
    removeSelected : true,
    zoomIn : true,
    zoomOut : true,
    zoomDefault : true,
    dirty : true,
    tabs : 1
  };

  clientApi.on('tools:state-changed', function (tab, state) {
    debug('---> tools:state-changed: ', tab, state);
    menuState.diagramType = tab.file.fileType;
    menuState.undo = state.canUndo;
    menuState.dirty = state.dirty;
    menuState.tabs = clientApi.tabs.length;

    ipcRenderer.send('menu:update', menuState);
  });

  clientApi.on('tab:closed', function (tab) {
    menuState.tabs = clientApi.tabs.length;
    ipcRenderer.send('menu:update', menuState);
  });


};