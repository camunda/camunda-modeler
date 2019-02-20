/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Workspace API used by app.
 */
export default class Workspace {
  constructor(backend) {
    this.backend = backend;
  }

  save(config) {
    return this.backend.send('workspace:save', config);
  }

  restore(defaultConfig) {
    return this.backend.send('workspace:restore', defaultConfig);
  }
}