/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

class ClientTransport {
  constructor(client, isClientReady) {
    this.client = client;
    this.isClientReady = isClientReady;

    this.buffer = [];
  }

  info() {}

  debug() {}

  warn() {}

  /**
   *
   * @param {string} message
   */
  error(message) {
    if (message.startsWith('client')) {
      return;
    }

    this.buffer.push(message);

    if (!this.isClientReady()) {
      return;
    }

    const files = this.buffer.slice();

    this.buffer.length = 0;

    files.forEach(bufferedMessage => this.client.send('backend:error', bufferedMessage));
  }
}

module.exports = ClientTransport;
