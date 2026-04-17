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
 * Tiny event-emitter service that bridges the bpmn-js context pad entry
 * (`append.guided`) to React. The context pad entry calls `guidedAppend.open(element)`;
 * BpmnEditor subscribes via `guidedAppend.on('open', handler)` to mount the
 * <AppendWizard/> in its own React tree.
 *
 * We don't reuse the modeler's eventBus because the eventBus payload is
 * constrained and we want to keep this flow obvious and easy to reason about.
 */
export default function GuidedAppend() {
  this._listeners = [];
}

GuidedAppend.$inject = [];

GuidedAppend.prototype.open = function(element) {
  this._listeners.forEach(fn => fn(element));
};

GuidedAppend.prototype.on = function(event, handler) {
  if (event !== 'open') return () => {};
  this._listeners.push(handler);
  return () => {
    this._listeners = this._listeners.filter(h => h !== handler);
  };
};
