'use strict';

var MenuBuilder = require('./menu/menu-builder');

var renderer = require('./util/renderer');


function ContextMenu() {

  var contextMenu = new MenuBuilder().buildContextMenu();

  renderer.on('context-menu:open', function() {
    contextMenu.openPopup();
  });
}

module.exports = ContextMenu;
