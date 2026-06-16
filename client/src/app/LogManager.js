/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { assign } from 'min-dash';

/**
 * Owns the log entries for <App>.
 *
 * Appends and clears log entries (opening the log panel as needed) while
 * delegating persistence of the `logEntries` list to the host <App>.
 */
export default class LogManager {

  /**
   * @param {import('./App').App} app
   */
  constructor(app) {
    this._app = app;
  }

  /**
   * Open log and add entry.
   *
   * @param {string} message - Message to be logged.
   * @param {string} category - Category of message.
   * @param {string} action - Action to be triggered.
   * @param {boolean} silent - Log without opening the panel.
   */
  logEntry(message, category, action, silent) {
    if (!silent) {
      this._app.openPanel('log');
    }

    const logEntry = {
      category,
      message
    };

    if (action) {
      assign(logEntry, {
        action
      });
    }

    this._app.setState((state) => {
      const {
        logEntries
      } = state;

      return {
        logEntries: [
          ...logEntries,
          logEntry
        ]
      };
    });
  }

  clearLog() {
    this._app.setState({
      logEntries: []
    });
  }
}
