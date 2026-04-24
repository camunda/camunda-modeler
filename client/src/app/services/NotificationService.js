/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { isString } from 'min-dash';

const NOTIFICATION_TYPES = [ 'info', 'success', 'error', 'warning' ];


/**
 * Service for managing notifications and log entries.
 *
 * @param {object} deps
 * @param {import('./AppStore').default} deps.store - Application state store.
 * @param {function} deps.openPanel - Opens a panel (e.g., 'log')
 */
export default class NotificationService {

  constructor({ store, openPanel }) {
    this._store = store;
    this._openPanel = openPanel;
    this._currentNotificationId = 0;
  }

  /**
   * Display notification.
   *
   * @param {Object} options
   * @param {string} options.title
   * @param {import('react').ReactNode} [options.content]
   * @param {'info'|'success'|'error'|'warning'} [options.type='info']
   * @param {number} [options.duration=4000]
   *
   * @returns {{ update: (options: object) => void, close: () => void }}
   */
  displayNotification({ type = 'info', title, content, duration = 4000 }) {
    const { notifications } = this._store.getState();

    if (!NOTIFICATION_TYPES.includes(type)) {
      throw new Error('Unknown notification type');
    }

    if (!isString(title)) {
      throw new Error('Title should be string');
    }

    const id = this._currentNotificationId++;

    const close = () => {
      this._closeNotification(id);
    };

    const update = newProps => {
      this._updateNotification(id, newProps);
    };

    const notification = {
      content,
      duration,
      id,
      close,
      title,
      type
    };

    this._store.setState({
      notifications: [
        ...notifications,
        notification
      ]
    });

    return {
      close,
      update
    };
  }

  closeNotifications() {
    this._store.setState({
      notifications: []
    });
  }

  _updateNotification(id, options) {
    const notifications = this._store.getState().notifications.map(notification => {
      const { id: currentId } = notification;

      return currentId !== id ? notification : { ...notification, ...options };
    });

    this._store.setState({ notifications });
  }

  _closeNotification(id) {
    const notifications = this._store.getState().notifications.filter(({ id: currentId }) => currentId !== id);

    this._store.setState({ notifications });
  }

  /**
   * Log an entry.
   *
   * @param {string} message - Message to be logged.
   * @param {string} category - Category of message.
   * @param {string} action - Action to be triggered.
   * @param {boolean} silent - Log without opening the panel.
   */
  logEntry(message, category, action, silent) {

    if (!silent) {
      this._openPanel('log');
    }

    const logEntry = {
      category,
      message
    };

    if (action) {
      Object.assign(logEntry, {
        action
      });
    }

    this._store.setState((state) => {

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
    this._store.setState({
      logEntries: []
    });
  }
}
