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
 * TabStorage - Generic in-memory storage for tab-based data
 *
 * Provides a simple key-value store per tab, using tab IDs as keys.
 * Data is stored in memory only and cleared when tabs are closed.
 *
 * This class is generic and can be used for any tab-specific state,
 * not just connection management.
 */
export default class TabStorage {
  constructor() {
    this._storage = new Map(); // tabId -> { key: value, ... }
  }

  /**
   * Get a value from tab storage
   *
   * @param {Object} tab - The tab object with an id property
   * @param {string} key - The storage key
   * @param {*} defaultValue - Default value if not found
   *
   * @returns {*} The stored value or defaultValue
   */
  get(tab, key, defaultValue = null) {
    const tabData = this._storage.get(tab.id);
    if (!tabData) {
      return defaultValue;
    }
    const value = tabData[key];
    return value !== undefined ? value : defaultValue;
  }

  /**
   * Set a value in tab storage
   *
   * @param {Object} tab - The tab object with an id property
   * @param {string} key - The storage key
   * @param {*} value - The value to store
   */
  set(tab, key, value) {
    const tabId = tab.id;
    if (!this._storage.has(tabId)) {
      this._storage.set(tabId, {});
    }
    const tabData = this._storage.get(tabId);
    tabData[key] = value;
  }

  /**
   * Get all data for a tab
   *
   * @param {Object} tab - The tab object with an id property
   *
   * @returns {Object} All stored key-value pairs for the tab
   */
  getAll(tab) {
    return this._storage.get(tab.id) || {};
  }

  /**
   * Remove all data for a tab
   *
   * @param {string} tabId - The tab ID
   */
  removeTab(tabId) {
    this._storage.delete(tabId);
  }

  /**
   * Clear all data from storage
   */
  clear() {
    this._storage.clear();
  }
}
