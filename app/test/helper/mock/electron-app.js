/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

/**
 * Simple mock of electron's <app> module
 */
const ElectronApp = {
  name: 'app',
  emit() {}
};

module.exports = ElectronApp;
