/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import NotificationService from './NotificationService';

/**
 * Descriptor for the notification service.
 *
 * Depends on `layout` service (must be registered after `layoutDescriptor`).
 */
export default {
  name: 'notification',

  create({ setState, getState, layout }) {
    return new NotificationService({
      setState,
      getState,
      openPanel: (...args) => layout.openPanel(...args)
    });
  },

  actions(service) {
    return {
      'log': (options) => {
        const { action, category, message, silent } = options;
        return service.logEntry(message, category, action, silent);
      },
      'display-notification': (options) => service.displayNotification(options)
    };
  }
};
