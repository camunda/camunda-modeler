'use strict';

function LinuxIntegration(app) {

  // close handling
  app.on('window-all-closed', function () {
    app.quit();
  });

  // editor menu
  app.on('editor-create-menu', function(mainWindow) {
    // TODO(nre): create
  });
}

module.exports = LinuxIntegration;