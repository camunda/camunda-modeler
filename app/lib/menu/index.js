'use strict';

var renderer = require('../util/renderer');

var requirePlatform = require('../util/requirePlatform');


function Menu(platform) {
  var MenuBuilder = requirePlatform(platform, __dirname);

  // Replacing Electron default menu until application loads
  new MenuBuilder().build();

  renderer.on('menu:update', function(clientState) {

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
      dmn: isDmn(clientState),
      bpmn: isBpmn(clientState),
      undo: clientState.undo,
      redo: clientState.redo,
      edit: atLeastOneTabOpen(clientState),
      save: atLeastOneTabOpen(clientState),
      saveAs: atLeastOneTabOpen(clientState),
      closeTab: atLeastOneTabOpen(clientState)
    };

    new MenuBuilder({ state: menuState }).build();
  });
}

module.exports = Menu;
