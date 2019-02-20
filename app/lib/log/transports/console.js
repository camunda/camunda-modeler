/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

class ConsoleTransport {
  info(message) {
    console.info(message);
  }

  error(message) {
    console.error(message);
  }
}

module.exports = ConsoleTransport;
