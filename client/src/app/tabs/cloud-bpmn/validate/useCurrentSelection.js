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

/**
 * useCurrentSelection — returns the first selected bpmn-js element (or null).
 *
 * Multi-select: we take the first. Validate mode is single-element by nature;
 * if a user rubber-bands five tasks, operating on one is the useful default.
 *
 * The hook owns its own subscription so callers can mount in any React tree
 * that has the injector — no prop drilling of "selected element" state from
 * BpmnEditor downward.
 */
export default function useCurrentSelection(injector) {
  const [ element, setElement ] = useState(() => readSelection(injector));

  useEffect(() => {
    if (!injector) return undefined;

    const eventBus = injector.get('eventBus');
    const handler = () => setElement(readSelection(injector));

    // Prime with current selection in case the hook mounts after the user
    // has already selected something.
    handler();

    eventBus.on('selection.changed', handler);
    return () => eventBus.off('selection.changed', handler);
  }, [ injector ]);

  return element;
}

function readSelection(injector) {
  if (!injector) return null;
  try {
    const selection = injector.get('selection');
    const selected = selection.get();
    return selected && selected.length > 0 ? selected[0] : null;
  } catch (e) {
    return null;
  }
}
