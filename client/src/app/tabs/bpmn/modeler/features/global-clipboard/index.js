/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

var Clipboard = require('diagram-js/lib/features/clipboard/Clipboard').default;

module.exports = {
  clipboard: [ 'value', new Clipboard() ]
};
