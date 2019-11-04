/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const { format } = require('util');

function createLog(namespace) {
  return new Log(namespace);
}

createLog.transports = [];

createLog.addTransports = function addTransports(...transports) {
  createLog.transports = createLog.transports.concat(transports);
};

class Log {
  constructor(namespace) {
    this.namespace = namespace;
  }

  log(type, args) {

    const message = format(...args);

    createLog.transports.forEach(transport => {
      transport[type](`${this.namespace} ${message}`);
    });
  }

  info(...args) {
    this.log('info', args);
  }

  warn(...args) {
    this.log('warn', args);
  }

  error(...args) {
    this.log('error', args);
  }
}

module.exports = createLog;
