/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

export default class CommandPalette {
  constructor(commands) {
    this._commands = commands;

    this._registeredCommands = {};
  }

  /**
   * e.g. registerCommand('Create new tab', 'tab.create');
   * e.g. registerCommand('Deploy', 'tab.deploy', (tab) => tab.type === 'bpmn');
   *
   * @param {String} title
   * @param {String} command
   * @param {Function} [enabled]
   */
  registerCommand(title, command, enabled) {
    if (this._registeredCommands[command]) {
      throw new Error(`command <${command}> already registered`);
    }

    this._registeredCommands[command] = {
      command,
      enabled,
      title
    };
  }

  executeCommand(command) {
    this._commands.executeCommand(command);
  }

  getRegistered(filter) {
    if (!filter) {
      return Object.values(this._registeredCommands);
    }

    return Object.values(this._registeredCommands).filter(filter);
  }
}