/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { useEffect, useState } from 'react';

import modeConfig, { MODES, getModeConfig } from './modeConfig';

/**
 * modeController — tiny per-editor observable store for the current mode.
 *
 * We deliberately keep this outside of React so the class-based BpmnEditor and
 * the functional rail/palette components share one source of truth. Each
 * BpmnEditor instance owns its own controller (see createModeController).
 *
 *   const ctrl = createModeController({ initial: 'design' });
 *   ctrl.get();                         // 'design'
 *   ctrl.set('implement');              // notifies listeners
 *   const off = ctrl.subscribe(fn);     // returns unsubscribe
 *   ctrl.getConfig();                   // modeConfig[current]
 *
 * Functional components use the useMode(ctrl) hook below.
 */
export function createModeController(options = {}) {
  const initial = MODES.includes(options.initial) ? options.initial : 'design';
  let current = initial;
  const listeners = new Set();

  return {
    get() {
      return current;
    },
    getConfig() {
      return getModeConfig(current);
    },
    set(next) {
      if (!MODES.includes(next) || next === current) return;
      current = next;
      listeners.forEach(fn => {
        try { fn(current); } catch (e) { /* swallow — prototype */ }
      });
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    getAvailable() {
      return MODES.slice();
    }
  };
}

/**
 * React hook for functional components (rail, palette).
 * Returns { mode, setMode, config, modes }.
 *
 * Re-renders when the controller's mode changes.
 */
export function useMode(controller) {
  const [ mode, setLocalMode ] = useState(controller ? controller.get() : 'design');

  useEffect(() => {
    if (!controller) return undefined;
    setLocalMode(controller.get());
    return controller.subscribe(setLocalMode);
  }, [ controller ]);

  return {
    mode,
    setMode: next => controller && controller.set(next),
    config: getModeConfig(mode),
    modes: MODES,
    allConfigs: modeConfig
  };
}
