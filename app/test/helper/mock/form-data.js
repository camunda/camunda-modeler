/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

function FormData() {
  this.data = {};
}

FormData.prototype.append = function(key, value) {
  this[key] = value;
};

module.exports = FormData;