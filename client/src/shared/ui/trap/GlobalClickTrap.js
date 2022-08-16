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
 * Trigger callback for mousedown event outside of the ignored elements.
 *
 * @param {() => Element[]} getIgnoredElements
 * @param {() => void} callback
 */
export default function GlobalClickTrap(getIgnoredElements, callback) {

  function mount() {
    document.addEventListener('mousedown', handleMouseDown, { capture: true });
  }

  function unmount() {
    document.removeEventListener('mousedown', handleMouseDown, { capture: true });
  }

  function handleMouseDown(event) {
    const elements = getIgnoredElements();

    if (elements.some(element => element.contains(event.target))) {
      return;
    }

    callback();
  }

  return {
    mount,
    unmount
  };

}
