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
 * Tracks mounted traps of one kind, so that only the topmost
 * (most recently mounted) trap handles events, e.g. for a
 * dialog opened on top of another dialog.
 */
export default function TrapStack() {
  const traps = [];

  function push(trap) {
    traps.push(trap);
  }

  function remove(trap) {
    const index = traps.lastIndexOf(trap);

    if (index !== -1) {
      traps.splice(index, 1);
    }
  }

  function isTop(trap) {
    return traps[ traps.length - 1 ] === trap;
  }

  return {
    push,
    remove,
    isTop
  };
}
