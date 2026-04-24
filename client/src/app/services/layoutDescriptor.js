/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import LayoutService from './LayoutService';

/**
 * Descriptor for the layout service.
 *
 * Must be registered **before** the notification descriptor because
 * NotificationService depends on `layout.openPanel`.
 */
export default {
  name: 'layout',

  create({ setState, getState }) {
    return new LayoutService({ setState, getState });
  },

  actions(service) {
    return {
      'open-log': () => service.openPanel('log'),
      'open-panel': (options) => service.openPanel(options.tab),
      'close-panel': () => service.closePanel()
    };
  }
};
