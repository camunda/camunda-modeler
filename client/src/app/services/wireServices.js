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
 * Wire service-owned actions and event subscriptions.
 *
 * Returns a `destroy` function that removes the event subscriptions.
 *
 * @param {object} options
 * @param {object} options.services          - `{ layout, notification, linting }` service instances
 * @param {object} options.actionRegistry    - ActionRegistry to register service actions on
 * @param {object} options.eventEmitter      - object with `on(event, handler)` / `off(event, handler)`
 *
 * @returns {Function} destroy — call to unsubscribe all events
 */
export default function wireServices({ services, actionRegistry, eventEmitter }) {
  const { layout, notification, linting } = services;

  const subscriptions = [];

  function on(event, handler) {
    eventEmitter.on(event, handler);
    subscriptions.push({ event, handler });
  }

  // -- Layout actions --
  if (layout) {
    actionRegistry.register('open-log', () => layout.openPanel('log'));
    actionRegistry.register('open-panel', (options) => layout.openPanel(options.tab));
    actionRegistry.register('close-panel', () => layout.closePanel());
  }

  // -- Notification actions --
  if (notification) {
    actionRegistry.register('log', (options) => {
      const { action, category, message, silent } = options;
      return notification.logEntry(message, category, action, silent);
    });
    actionRegistry.register('display-notification', (options) =>
      notification.displayNotification(options));
  }

  // -- Linting actions + events --
  if (linting) {
    actionRegistry.register('lint-tab', (options) => {
      const { tab, contents } = options;
      return linting.lintTab(tab, contents);
    });

    on('connectionManager.connectionStatusChanged',
      linting.handleConnectionStatusChanged);
    on('connectionManager.connectionCheckStarted',
      linting.handleConnectionCheckStarted);
    on('tab.engineProfileChanged',
      linting.handleEngineProfileChanged);
  }

  // Return teardown function
  return function destroy() {
    for (const { event, handler } of subscriptions) {
      eventEmitter.off(event, handler);
    }
  };
}
