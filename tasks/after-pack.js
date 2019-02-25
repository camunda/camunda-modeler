/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const handlers = [
  require('./after-pack/add-version'),
  require('./after-pack/add-platform-files')
];


async function afterPack(context) {
  return Promise.all(
    handlers.map(h => h(context))
  );
}

module.exports = afterPack;