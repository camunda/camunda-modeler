/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

export default class Commands {
  constructor() {
    this._registeredCommands = {};
  }

  registerCommand(command, commandHandler) {
    if (this._registeredCommands[command]) {
      throw new Error(`command <${command}> already registered`);
    }

    this._registeredCommands[command] = commandHandler;
  }

  /**
   * e.g. executeCommand('tab.create');
   */
  executeCommand(command) {
    if (!this._registeredCommands[command]) {
      throw new Error(`command <${command}> not registered`);
    }

    this._registeredCommands[command]();
  }
}