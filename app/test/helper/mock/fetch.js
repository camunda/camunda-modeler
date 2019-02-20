/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var RESPONSE_OK = { mocked: true };

module.exports = function(url, options) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(RESPONSE_OK)
  });
};

module.exports.RESPONSE_OK = RESPONSE_OK;