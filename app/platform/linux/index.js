'use strict';

function LinuxIntegration(app) {

  // close handling
  app.on('window-all-closed', function () {
    app.quit();
  });
}

module.exports = LinuxIntegration;