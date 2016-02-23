'use strict';

function LinuxPlatform(app) {

  // close handling
  app.on('window-all-closed', function () {
    app.quit();
  });
}

module.exports = LinuxPlatform;
