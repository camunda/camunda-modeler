/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

export default function CloseTrap(initiator) {

  let focusElement;

  function mount() {
    focusElement = initiator;
  }

  function unmount() {
    if (focusElement) {
      focusElement.focus();
      focusElement = null;
    }
  }

  return {
    mount,
    unmount
  };

}
