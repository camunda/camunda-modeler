/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const { Console } = require('console');
const fs = require('fs');

class FileTransport {
  constructor(logPath) {
    this.console = new Console({
      stdout: fs.createWriteStream(logPath, { flags: 'a' })
    });
  }

  log(type, message) {
    this.console.log(`${new Date().toISOString()}  ${type.toUpperCase()} ${message}`);
  }

  info(message) {
    this.log('info', message);
  }

  warn(message) {
    this.log('warn', message);
  }

  error(message) {
    this.log('error', message);
  }
}

module.exports = FileTransport;
