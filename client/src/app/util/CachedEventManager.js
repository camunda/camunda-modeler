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
 * Provides an EventContext that can cache certain events.
 *
 * Named events are cached when emitted and immediately re-emitted to new subscribers.
 */
export class CachedEventManager {

  /**
   * Create a new CachedEventManager.
   *
   * @param {string[]} cachedEventNames - Array of event names to cache
   */
  constructor(cachedEventNames = []) {
    this.cachedEventNames = new Set(cachedEventNames);
    this.cache = new Map();
  }

  /**
   * Add an event name to be cached.
   *
   * @param {string} eventName - Name of the event to cache
   */
  addCachedEvent(eventName) {
    this.cachedEventNames.add(eventName);
  }

  /**
   * Add multiple event names to be cached.
   *
   * @param {string[]} eventNames - Array of event names to cache
   */
  addCachedEvents(eventNames) {
    eventNames.forEach(name => this.cachedEventNames.add(name));
  }

  /**
   * Check if an event should be cached.
   *
   * @param {string} eventName - Name of the event
   * @returns {boolean} - True if event should be cached
   */
  shouldCache(eventName) {
    return this.cachedEventNames.has(eventName);
  }

  /**
   * Cache an event's data.
   *
   * @param {string} eventName - Name of the event
   * @param {...any} args - Arguments to cache (typically the first argument)
   */
  cacheEvent(eventName, ...args) {
    if (this.shouldCache(eventName)) {
      this.cache.set(eventName, args[0]);
    }
  }

  /**
   * Get cached value for an event.
   *
   * @param {string} eventName - Name of the event
   * @returns {any} - Cached value or undefined
   */
  getCachedValue(eventName) {
    return this.cache.get(eventName);
  }

  /**
   * Check if an event has a cached value.
   *
   * @param {string} eventName - Name of the event
   * @returns {boolean} - True if value is cached
   */
  hasCachedValue(eventName) {
    return this.cache.has(eventName);
  }

  /**
   * Clear a cached value.
   *
   * @param {string} eventName - Name of the event
   */
  clearCachedValue(eventName) {
    this.cache.delete(eventName);
  }

  /**
   * Clear all cached values.
   */
  clearAll() {
    this.cache.clear();
  }

  /**
   * Create an emit wrapper that automatically caches events.
   *
   * @param {Function} originalEmit - Original emit function
   * @returns {Function} - Wrapped emit function
   */
  createEmitWrapper(originalEmit) {
    return (event, ...args) => {
      this.cacheEvent(event, ...args);
      return originalEmit(event, ...args);
    };
  }

  /**
   * Create an events context object for subscribing with cache support.
   *
   * @param {Object} eventEmitter - Object with on/off methods (typically EventEmitter)
   * @returns {Object} - Events context with subscribe method
   */
  createEventsContext(eventEmitter) {
    return {
      subscribe: (event, listener) => {
        eventEmitter.on(event, listener);

        if (this.hasCachedValue(event)) {
          listener(this.getCachedValue(event));
        }

        return {
          cancel: () => eventEmitter.off(event, listener)
        };
      }
    };
  }
}
