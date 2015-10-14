'use strict';

var menus = require('./MenusLinux');

function LinuxIntegration(app) {

  // close handling
  app.on('window-all-closed', function () {
    app.quit();
  });

  // editor menu
  app.on('editor-create-menu', function(mainWindow, fileSystem) {
    menus(mainWindow, fileSystem);
  });
}

module.exports = LinuxIntegration;
