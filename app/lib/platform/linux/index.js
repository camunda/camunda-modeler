'use strict';

var Menus = require('../Menus');

function LinuxPlatform(app) {

  // close handling
  app.on('window-all-closed', function () {
    app.quit();
  });

  // editor menu
  app.on('editor:create-menu', function(mainWindow, notation) {
    var positions = {
      edit: 1
    };

    new Menus(mainWindow, notation, positions);
  });
}

module.exports = LinuxPlatform;
