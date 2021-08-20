/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

export default class SystemClipboard {

  constructor(backend) {
    this.backend = backend;
  }

  /**
   * Write given text to system clipboard.
   *
   * @param {Object} options Options.
   * @param {string} [options.text] Text to be stored in system clipboard.
   *
   * @returns {undefined}
   */
  writeText(options) {
    return this.backend.send('system-clipboard:write-text', options);
  }

}
