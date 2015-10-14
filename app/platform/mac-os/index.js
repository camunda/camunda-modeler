'use strict';

var menus = require('./MenusMac');

function MacOSIntegration(app) {

  // editor menu
  app.on('editor-create-menu', function(mainWindow, fileSystem) {
    menus(mainWindow, fileSystem);
  });
}

module.exports = MacOSIntegration;
