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
 * ModeManager — a thin bpmn-js service that mirrors the React-owned "mode"
 * state (design / implement / simulate / test) into the diagram modules.
 *
 * Writers: BpmnEditor.js only (on React state change).
 * Readers: future palette/context-pad/linter features that want to branch on
 * the current mode. They subscribe via `on('change', fn)` and never write.
 *
 * Pattern mirrors GuidedAppend: tiny listener list, no framework coupling.
 */
export default function ModeManager() {
  this._mode = 'design';
  this._listeners = [];
}

ModeManager.$inject = [];

ModeManager.prototype.get = function() {
  return this._mode;
};

ModeManager.prototype.set = function(mode) {
  if (!mode || mode === this._mode) return;
  this._mode = mode;
  this._listeners.forEach(fn => fn(mode));
};

ModeManager.prototype.on = function(event, handler) {
  if (event !== 'change') return () => {};
  this._listeners.push(handler);
  return () => {
    this._listeners = this._listeners.filter(h => h !== handler);
  };
};
