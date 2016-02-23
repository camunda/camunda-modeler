'use strict';

var r = require('../util/requirePlatform');
var ipcMain = require('electron').ipcMain;

module.exports = function Menu(platform) {
  var MenuBuilder = r(platform, __dirname, require('./MenuBuilder'));

  // Replacing Electron default menu until application loads
  new MenuBuilder().build();

  ipcMain.on('menu:update', function (evt, clientState) {

    function atLeastOneTabOpen(state) {
      return state.tabs > 1;
    }

    function isDmn(state) {
      return state.diagramType === 'dmn';
    }

    function isBpmn(state) {
      return !isDmn(state);
    }

    var menuState = {
      save: atLeastOneTabOpen(clientState),
      saveAs: atLeastOneTabOpen(clientState),
      closeTab: atLeastOneTabOpen(clientState),
      dmn: isDmn(clientState),
      bpmn: isBpmn(clientState),
      undo: clientState.undo,
      redo: clientState.redo,
      edit: atLeastOneTabOpen(clientState)
    };

    new MenuBuilder({
      state: menuState
    }).build();
  });
};