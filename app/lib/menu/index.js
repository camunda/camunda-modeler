'use strict';

var assign = require('lodash/object/assign');

var renderer = require('../util/renderer');

var requirePlatform = require('../util/requirePlatform');

var electron = require('electron'),
    app = electron.app;


function Menu(platform) {
  var MenuBuilder = this.MenuBuilder = requirePlatform(platform, __dirname);

  // Replacing Electron default menu until application loads
  new MenuBuilder().build();


  app.on('menu:action', function(action, options) {
    if (app.mainWindow) {
      return renderer.send('menu:action', action, options);
    }

    app.once('app:client-ready', function() {
      renderer.send('menu:action', action);
    });

    app.createEditorWindow();
  });


  app.on('window-all-closed', function() {
    new MenuBuilder().build();
  });


  function rebuildMenu(state){
    var mainWindow = app.mainWindow,
        isDevToolsOpened = false;

    if (!state.hasOwnProperty('devtools') && mainWindow) {
      isDevToolsOpened = mainWindow.isDevToolsOpened();

      state = assign(state, { devtools: isDevToolsOpened });
    }

    new MenuBuilder({ state: state }).build();
  }

  renderer.on('menu:update', rebuildMenu);
  app.on('menu:update', rebuildMenu);
}

module.exports = Menu;


Menu.prototype.rebuild = function() {
  var MenuBuilder = this.MenuBuilder;

  new MenuBuilder().build();
};
