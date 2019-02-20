/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { copySync } = require('cpx');

module.exports = function(context) {

  const {
    appOutDir,
    electronPlatformName
  } = context;

  copySync('resources/platform/base/**', appOutDir);
  copySync(`resources/platform/${electronPlatformName}/**`, appOutDir);
};