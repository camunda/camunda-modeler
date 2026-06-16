/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/**
 * Frontend API for the embedded c8ctl terminal backend.
 *
 * Thin bridge over the IPC `c8ctl:*` channels, mirroring the `ZeebeAPI` remote.
 * All command execution happens in the Electron main process; this class only
 * forwards requests and returns results.
 */
export default class C8ctl {
  constructor(backend) {
    this._backend = backend;
  }

  /**
   * Execute a command line on the backend.
   *
   * @param {string} command
   * @returns {Promise<{ output: string, isError: boolean }>}
   */
  execute(command) {
    return this._backend.send('c8ctl:execute', { command });
  }

  /**
   * Get terminal metadata (prompt + available commands).
   *
   * @returns {Promise<{ prompt: string, commands: Array<{ command: string, description: string }> }>}
   */
  getInfo() {
    return this._backend.send('c8ctl:getInfo', {});
  }

  /**
   * Prefix-complete a partial command line.
   *
   * @param {string} line
   * @returns {Promise<string[]>}
   */
  complete(line) {
    return this._backend.send('c8ctl:complete', { line });
  }
}
