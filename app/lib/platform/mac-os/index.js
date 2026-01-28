/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

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
   * Handle protocol URLs on macOS.
   * Please see "https://github.com/atom/electron/blob/master/docs/api/app.md#event-open-url-os-x"
   * for more info.
   */
  app.on('open-url', function(e, url) {
    e.preventDefault();

    log.info('received protocol URL:', url);
    console.log('Camunda Modeler Protocol URL received:', url);
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
    if (app.terminating || app.quitRequested) {
      return app.quit();
    }

    e.preventDefault();

    log.info('Keeping app in the dock');

    app.terminating = false;
  });

  /**
   * Make sure app quits and does not hang after last
   * window was closed.
   *
   * Cf. https://github.com/camunda/camunda-modeler/issues/1803
   */
  app.on('before-quit', function() {
    app.quitRequested = true;
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
