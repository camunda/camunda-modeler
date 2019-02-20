/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

var hasProp = Object.prototype.hasOwnProperty;


module.exports = function hasProperty(object, propName) {
  return hasProp.call(object, propName);
};