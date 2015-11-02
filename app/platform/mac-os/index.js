'use strict';

var menusMac = require('./MenusMac');

function MacOSIntegration(app) {

  // editor menu
  app.on('editor-create-menu', function(mainWindow) {
    menusMac(mainWindow);
  });

  // modeler was opened through file association
  app.on('association-file-open', function(filePath) {
    if (filePath) {
      app.fileSystem.addFile(filePath);
    }
  });

  app.on('editor-add-recent', function(path) {
    app.addRecentDocument(path);
  });
}

module.exports = MacOSIntegration;
