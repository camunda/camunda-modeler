'use strict';

function LinuxPlatform(app) {
  app.on('window-all-closed', function() {
    app.quit();
  });
}

module.exports = LinuxPlatform;