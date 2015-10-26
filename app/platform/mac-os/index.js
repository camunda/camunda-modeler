'use strict';

var menusMac = require('./MenusMac');

function MacOSIntegration(app) {

  // editor menu
  app.on('editor-create-menu', function(mainWindow) {
    menusMac(mainWindow);
  });
}

module.exports = MacOSIntegration;
