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
 *   - `deps`            — (optional) array of service names this descriptor depends on
 *   - `create(deps)`    — factory; receives resolved dependencies, returns the instance
 *   - `actions(service)` — (optional) map of action-name → handler, registered on the ActionRegistry
 *   - `events(service)`  — (optional) map of event-name → handler, subscribed via the EventEmitter
 *
 * The container automatically resolves the instantiation order from declared
 * `deps` — callers can pass descriptors in any order.
 *
 * Dependencies available to every factory:
 *   `setState`, `getState` — app-level state helpers
 *   any named service resolved via `deps`
 *   any extra deps passed via `options.deps`
 */
export default class ServiceContainer {

  /**
   * @param {object} options
   * @param {Array<object>} options.descriptors  - service descriptors (any order)
   * @param {object}        options.deps         - shared dependencies (setState, getState, …)
   * @param {object}        options.eventEmitter - object with `on(event, handler)` method
   * @param {object}        options.actionRegistry - ActionRegistry instance
   */
  constructor({ descriptors, deps, eventEmitter, actionRegistry }) {

    /** @type {Map<string, object>} */
    this._services = new Map();

    this._subscriptions = [];

    const sorted = sortDescriptors(descriptors);

    for (const descriptor of sorted) {
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


// helpers ///////////////

/**
 * Topological sort of descriptors based on declared `deps`.
 *
 * @param {Array<object>} descriptors
 * @returns {Array<object>} sorted descriptors
 */
function sortDescriptors(descriptors) {
  const byName = new Map(descriptors.map(d => [ d.name, d ]));
  const visited = new Set();
  const visiting = new Set();
  const sorted = [];

  function visit(descriptor) {
    const { name, deps: serviceDeps = [] } = descriptor;

    if (visited.has(name)) {
      return;
    }

    if (visiting.has(name)) {
      throw new Error(`Circular dependency detected: ${ name }`);
    }

    visiting.add(name);

    for (const depName of serviceDeps) {
      const dep = byName.get(depName);

      if (dep) {
        visit(dep);
      }
    }

    visiting.delete(name);
    visited.add(name);
    sorted.push(descriptor);
  }

  for (const descriptor of descriptors) {
    visit(descriptor);
  }

  return sorted;
}
