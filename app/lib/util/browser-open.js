/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { shell } = require('electron');

module.exports = function(url) {
  return shell.openExternal(url);
};
