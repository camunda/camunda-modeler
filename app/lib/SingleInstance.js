'use strict';

var app = require('app');

/**
 * Init singleton behavior
 */
function init() {

  // singleton application instance
  var shouldQuit = app.makeSingleInstance(function(commandLine, workingDirectory) {

    app.emit('editor:cmd', commandLine, workingDirectory);

    // focus existing running instance window
    var window = app.mainWindow;
    if (window) {
      if (window.isMinimized()) {
        window.restore();
      }

      window.focus();
    }

    return true;
  });

  if (shouldQuit) {
    return app.quit();
  }
}

module.exports.init = init;
