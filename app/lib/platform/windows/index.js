/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

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