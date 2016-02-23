'use strict';

function MacOSPlatform(app) {

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
