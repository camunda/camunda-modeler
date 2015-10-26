'use strict';

var Menus = require('../Menus');

function LinuxIntegration(app) {

  // close handling
  app.on('window-all-closed', function () {
    app.quit();
  });

  // editor menu
  app.on('editor-create-menu', function(mainWindow) {
    new Menus(mainWindow);
  });
}

module.exports = LinuxIntegration;
