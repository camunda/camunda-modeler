/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { Console } = require('console');
const fs = require('fs');

class FileTransport {
  constructor(logPath) {
    this.console = new Console({
      stdout: fs.createWriteStream(logPath, { flags: 'a' })
    });
  }

  info(message) {
    this.console.log('[' + new Date().toISOString() + '] ' + message);
  }

  error(message) {
    this.info(message);
  }
}

module.exports = FileTransport;
