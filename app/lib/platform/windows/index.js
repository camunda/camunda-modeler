'use strict';


function WindowsPlatform(app, config) {

  /**
   * Adding recent open files.
   */
  app.on('app:add-recent-file', function(path) {
    app.addRecentDocument(path);
  });

  app.on('window-all-closed', function() {
    app.quit();
  });
}

module.exports = WindowsPlatform;