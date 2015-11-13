'use strict';

var parseUtil = require('../../util/parse');

var Menus = require('../Menus');

function LinuxIntegration(app) {

  // close handling
  app.on('window-all-closed', function () {
    app.quit();
  });

  // editor menu
  app.on('editor-create-menu', function(mainWindow, notation) {
    var positions = {
      edit: 1
    };

    new Menus(mainWindow, notation, positions);
  });

  // modeler was opened through file association
  app.on('association-file-open', function() {
    var filePath = process.argv[1];

    if (parseUtil.hasExtension(filePath)) {
      app.fileSystem.addFile(filePath);
    }
  });
}

module.exports = LinuxIntegration;
