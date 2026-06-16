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

import { NOTIFICATION_TYPES } from './notifications';

/**
 * Owns the notification lifecycle for <App>.
 *
 * Manages creation, updating and removal of notifications (including the
 * notification id counter), while delegating persistence of the resulting
 * `notifications` list to the host <App> via `setState`.
 */
export default class NotificationManager {

  /**
   * @param {import('./App').App} app
   */
  constructor(app) {
    this._app = app;

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
    const app = this._app;

    const { notifications } = app.state;

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

    app.setState({
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
    this._app.setState({
      notifications: []
    });
  }

  _updateNotification(id, options) {
    const notifications = this._app.state.notifications.map(notification => {
      const { id: currentId } = notification;

      return currentId !== id ? notification : { ...notification, ...options };
    });

    this._app.setState({ notifications });
  }

  _closeNotification(id) {
    const notifications = this._app.state.notifications.filter(({ id: currentId }) => currentId !== id);

    this._app.setState({ notifications });
  }
}
