/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

function LinuxPlatform(app) {
  app.on('window-all-closed', function() {
    app.quit();
  });
}

module.exports = LinuxPlatform;