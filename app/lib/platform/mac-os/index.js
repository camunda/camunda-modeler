'use strict';

function MacOSPlatform(app) {

  /**
   * Adding recent open files.
   */
  app.on('app:add-recent-file', function(path) {
    app.addRecentDocument(path);
  });
}

module.exports = MacOSPlatform;
