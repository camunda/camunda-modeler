/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const fs = require('fs');

const {
  copySync: copyGlob
} = require('cpx');

const { name } = require('../../app/package');

function copy(src, dest) {
  fs.copyFileSync(src, dest);
}

module.exports = function(context) {

  const {
    appOutDir,
    electronPlatformName
  } = context;

  copyGlob('resources/platform/base/**', appOutDir);
  copyGlob(`resources/platform/${electronPlatformName}/**`, appOutDir);

  copy('LICENSE', `${appOutDir}/LICENSE.${name}.txt`);
};