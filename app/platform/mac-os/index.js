'use strict';

var menusMac = require('./MenusMac');

function MacOSPlatform(app) {

  // editor menu
  app.on('editor:create-menu', function(mainWindow, notation) {
    var positions = {
      edit: 2
    };

    menusMac(mainWindow, notation, positions);
  });

  app.on('editor:add-recent', function(path) {
    app.addRecentDocument(path);
  });

  app.on('editor:quit-allowed', function() {
    // app.quit() not working under Mac OSX,
    // fallback to a solution that always works ;-)
    process.exit(0);
  });
}

module.exports = MacOSPlatform;
