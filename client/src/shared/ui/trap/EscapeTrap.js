/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import TrapStack from './TrapStack';

const escapeTraps = TrapStack();

export default function EscapeTrap(onEscape) {

  const trap = {
    mount,
    unmount
  };

  function handleKeyDown(event) {
    if (isEscape(event) && escapeTraps.isTop(trap)) {
      onEscape(event);
    }
  }

  function mount() {
    escapeTraps.push(trap);

    document.addEventListener('keydown', handleKeyDown);
  }

  function unmount() {
    escapeTraps.remove(trap);

    document.removeEventListener('keydown', handleKeyDown);
  }

  return trap;

}


// helpers ///////////////

function isEscape(event) {
  return event.key === 'Escape';
}
