/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

var requirePlatform = require('../util/require-platform');

module.exports.create = function create(platform, app, config) {
  var Platform = requirePlatform(platform, __dirname);

  return new Platform(app, config);
};
