'use strict';

var menusMac = require('./MenusMac');

function MacOSIntegration(app) {

  // editor menu
  app.on('editor-create-menu', function(mainWindow, notation) {
    var positions = {
      edit: 2
    };

    menusMac(mainWindow, notation, positions);
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

  app.on('app-quit-allowed', function() {
    // app.quit() not working under Mac OSX,
    // fallback to a solution that always works ;-)
    process.exit(0);
  });
}

module.exports = MacOSIntegration;
