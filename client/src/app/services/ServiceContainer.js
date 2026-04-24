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
 * A container that bootstraps services from descriptors,
 * wires their event subscriptions, and registers their actions.
 *
 * Each descriptor declares:
 *
 *   - `name`            — unique identifier used to retrieve the service
 *   - `create(deps)`    — factory; receives resolved dependencies, returns the instance
 *   - `actions(service)` — (optional) map of action-name → handler, registered on the ActionRegistry
 *   - `events(service)`  — (optional) map of event-name → handler, subscribed via the EventEmitter
 *
 * Dependencies available to every factory:
 *   `setState`, `getState` — app-level state helpers
 *   any named service created *before* this one (order matters)
 *   any extra deps passed via `options.deps`
 */
export default class ServiceContainer {

  /**
   * @param {object} options
   * @param {Array<object>} options.descriptors  - ordered list of service descriptors
   * @param {object}        options.deps         - shared dependencies (setState, getState, …)
   * @param {object}        options.eventEmitter - object with `on(event, handler)` method
   * @param {object}        options.actionRegistry - ActionRegistry instance
   */
  constructor({ descriptors, deps, eventEmitter, actionRegistry }) {
    /** @type {Map<string, object>} */
    this._services = new Map();

    this._subscriptions = [];

    for (const descriptor of descriptors) {
      const { name, create, actions, events } = descriptor;

      // Build resolution bag: shared deps + already-created services
      const resolvable = { ...deps };

      for (const [ svcName, svcInstance ] of this._services) {
        resolvable[svcName] = svcInstance;
      }

      // Instantiate
      const service = create(resolvable);
      this._services.set(name, service);

      // Wire actions
      if (actions && actionRegistry) {
        const actionMap = actions(service);

        for (const [ actionName, handler ] of Object.entries(actionMap)) {
          actionRegistry.register(actionName, handler);
        }
      }

      // Wire event subscriptions
      if (events && eventEmitter) {
        const eventMap = events(service);

        for (const [ eventName, handler ] of Object.entries(eventMap)) {
          eventEmitter.on(eventName, handler);

          this._subscriptions.push({ eventName, handler });
        }
      }
    }
  }

  /**
   * Retrieve a service by name.
   *
   * @param {string} name
   * @returns {object}
   */
  get(name) {
    return this._services.get(name);
  }

  /**
   * Tear down: remove all event subscriptions that were wired during bootstrap.
   *
   * @param {object} eventEmitter
   */
  destroy(eventEmitter) {
    for (const { eventName, handler } of this._subscriptions) {
      eventEmitter.off(eventName, handler);
    }

    this._subscriptions = [];
  }
}
