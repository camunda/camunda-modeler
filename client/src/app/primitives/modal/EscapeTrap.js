/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

export default function EscapeTrap(onEscape) {

  function handleKeyDown(event) {
    if (isEscape(event)) {
      onEscape(event);
    }
  }

  function mount() {
    document.addEventListener('keydown', handleKeyDown);
  }

  function unmount() {
    document.removeEventListener('keydown', handleKeyDown);
  }

  return {
    mount,
    unmount
  };

}


// helpers ///////////////

function isEscape(event) {
  return event.key === 'Escape';
}
