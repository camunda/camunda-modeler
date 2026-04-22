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
 * ValidateSession — accumulates per-element output variables from successful
 * task runs within a single editor session.
 *
 * Lets the Validate panel offer "Suggested from prior runs" pre-fill when
 * the user selects a new element whose required inputs match variables
 * produced by earlier runs.
 *
 * Session-only: the Map is discarded on destroy(). Never serialized.
 */
export default class ValidateSession {

  constructor() {
    this._outputs = new Map(); // elementId → { variables: object, label: string }
    this._listeners = new Set();
  }

  /**
   * recordOutput(elementId, variables, label) — store the output variables
   * from a successful run. Overwrites any prior entry for the same element
   * (re-running always replaces).
   *
   * variables must be a plain object. label is the element's display name
   * (used in the "Suggested from: task1, URL lookup" hint).
   */
  recordOutput(elementId, variables, label) {
    if (!elementId || !variables || typeof variables !== 'object') return;
    this._outputs.set(elementId, { variables, label: label || elementId });
    this._notify();
  }

  /**
   * getAccumulatedVariables() — merge all stored outputs into one flat object.
   * Later elements in insertion order win on key collision (each run
   * overwrites the same elementId slot anyway, so this is deterministic).
   */
  getAccumulatedVariables() {
    const merged = {};
    for (const { variables } of this._outputs.values()) {
      Object.assign(merged, variables);
    }
    return merged;
  }

  /**
   * getSources() — array of { label, variableKeys } for display in the panel.
   */
  getSources() {
    return Array.from(this._outputs.values()).map(({ label, variables }) => ({
      label,
      variableKeys: Object.keys(variables)
    }));
  }

  isEmpty() {
    return this._outputs.size === 0;
  }

  /**
   * listen(callback) — subscribe to changes. Returns an unsubscribe function.
   */
  listen(callback) {
    this._listeners.add(callback);
    return () => this._listeners.delete(callback);
  }

  clear() {
    this._outputs.clear();
    this._notify();
  }

  destroy() {
    this.clear();
    this._listeners.clear();
  }

  _notify() {
    for (const cb of this._listeners) {
      cb();
    }
  }
}
