'use strict';

function MacOSPlatform(app) {

  /**
   * Adding recent open files.
   */
  app.on('app:add-recent-file', function(path) {
    app.addRecentDocument(path);
  });

  /**
   * Setting forced quit flag.
   * Quitting if window is already closed.
   */
  app.on('app:quit', function () {
    app.terminating = true;

    if (!app.mainWindow) {
      return app.quit();
    }
  });

  /**
   * Listens to 'quit-denied' event that is
   * only emitted when user directly closes window.
   */
  app.on('app:quit-denied', function () {
    app.terminating = false;
  });

  /**
   * Once window is closed, determining whether quit was
   * called or the window was closed.
   */
  app.on('window-all-closed', function (e) {
    if (app.terminating) {
      return app.quit();
    }

    e.preventDefault();

    console.log('Keeping app in the dock');

    app.terminating = false;
  });

  /**
   * Recreating window app activation through system dock
   */
  app.on('activate', function () {
    if (!app.mainWindow){
      app.createEditorWindow();
    }
  });

}

module.exports = MacOSPlatform;
