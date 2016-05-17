'use strict';

var assign = require('lodash/object/assign');

var renderer = require('../util/renderer');

var requirePlatform = require('../util/require-platform');

var electron = require('electron'),
    app = electron.app;


function Menu(platform) {
  var MenuBuilder = this.MenuBuilder = requirePlatform(platform, __dirname);

  // replace Electron default menu until application loads
  new MenuBuilder().build();

  // keep latest context menu reference for client popup triggers
  var contextMenu;

  // handle menu actions
  // make sure there is active client before sending action
  app.on('menu:action', function(action, options) {
    if (app.mainWindow) {
      return renderer.send('menu:action', action, options);
    }

    app.once('app:client-ready', function() {
      renderer.send('menu:action', action);
    });

    app.createEditorWindow();
  });

  // rebuild default menu on window closing while app is still running
  app.on('window-all-closed', function() {
    new MenuBuilder().build();
  });


  function rebuildMenu(state) {
    var mainWindow = app.mainWindow,
        isDevToolsOpened = false;

    if (!state.hasOwnProperty('devtools') && mainWindow) {
      isDevToolsOpened = mainWindow.isDevToolsOpened();

      state = assign(state, { devtools: isDevToolsOpened });
    }

    // rebuild main application menu
    new MenuBuilder({ state: state }).build();

    // rebuild context menu based on current state
    contextMenu = new MenuBuilder({ state: state }).buildContextMenu();
  }

  // handle state updates from client
  renderer.on('menu:update', rebuildMenu);

  // handle DevTools opening/closing specific state
  app.on('menu:update', rebuildMenu);

  // handle context menu trigger from client
  renderer.on('context-menu:open', function() {
    contextMenu.openPopup();
  });
}

module.exports = Menu;


Menu.prototype.rebuild = function() {
  var MenuBuilder = this.MenuBuilder;

  new MenuBuilder().build();
};
