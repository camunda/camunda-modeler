'use strict';

const log = require('../../log')('app:mac-os');

function MacOSPlatform(app) {

  /**
   * Adding recent open files.
   */
  app.on('app:add-recent-file', function(path) {
    app.addRecentDocument(path);
  });

  /**
   * Do not open URLs.
   * Please see "https://github.com/atom/electron/blob/master/docs/api/app.md#event-open-url-os-x"
   * for more info.
   */
  app.on('open-url', function(e) {
    e.preventDefault();

    log.info('application does not support opening URLs');
  });

  /**
   * Emitted when the user wants to open a file with the application.
   * Please see "https://github.com/atom/electron/blob/master/docs/api/app.md#event-open-file-os-x"
   * for more info.
   */
  app.on('open-file', function(e, filePath) {
    if (e) {
      e.preventDefault();
    }

    app.openFiles([ filePath ]);
  });

  /**
   * Setting forced quit flag.
   * Quitting if window is already closed.
   */
  app.on('app:quit', function() {
    app.terminating = true;

    if (!app.mainWindow) {
      return app.quit();
    }
  });

  /**
   * Listens to 'quit-denied' event that is
   * only emitted when user directly closes window.
   */
  app.on('app:quit-denied', function() {
    app.terminating = false;
  });

  /**
   * Once window is closed, determining whether quit was
   * called or the window was closed.
   */
  app.on('window-all-closed', function(e) {
    if (app.terminating) {
      return app.quit();
    }

    e.preventDefault();

    log.info('Keeping app in the dock');

    app.terminating = false;
  });

  /**
   * Recreating window app activation through system dock
   */
  function checkAppWindow() {
    if (!app.mainWindow) {
      app.createEditorWindow();
    } else {
      if (app.mainWindow.isMinimized()) {
        app.mainWindow.restore();
      }

      app.mainWindow.focus();
    }
  }

  /**
   * Making sure create window will be created only after the app
   * has finished initialising.
   */
  app.on('ready', function() {
    app.on('activate', checkAppWindow);
    app.on('open-file', checkAppWindow);
  });

}

module.exports = MacOSPlatform;
