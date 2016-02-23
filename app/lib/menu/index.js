'use strict';

var r = require('../util/requirePlatform');
var ipcMain = require('electron').ipcMain;

module.exports = function Menu(platform) {
  var MenuBuilder = r(platform, __dirname, require('./MenuBuilder'));

  // Replacing Electron default menu until application loads
  new MenuBuilder().build();

  ipcMain.on('menu:update', function (evt, menuState) {
    new MenuBuilder().build({
      menuState: menuState
    });
  });
};